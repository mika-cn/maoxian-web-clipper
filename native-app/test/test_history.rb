require 'test_helper'
require 'history'
require 'json'

class HistoryTest < Minitest::Test

  def setup
    @root_dir = '/home/foo/Downloads'
  end

  def test_clipping_info_old_version
    info = {}
    info_path = 'mx-wc/article/js/2019-01-01-1122334455/index.json'
    path = File.join(@root_dir, info_path)
    r = History::ClippingInfo.new(info, path)
    assert_equal '1122334455', r.clipId
    assert_equal 'html', r.format
    assert_equal 'index.html', r.filename
    assert_equal 'article/js', r.category
    assert_equal info_path, r.path

    info_path = 'mx-wc/article/js/2019-01-01/index.json'
    path = File.join(@root_dir, info_path)
    r = History::ClippingInfo.new(info, path)
    assert r.clipId =~ /^00/
  end

  def test_clipping_info_curr_version
    info = {
      id: '001',
      format: 'md',
      filename: 'awesome.html',
      category: 'foo/bar'
    }
    info_path = 'mx-wc/article/js/2019-01-01-1122334455/index.json'
    path = File.join(@root_dir, info_path)
    r = History::ClippingInfo.new(info, path)
    assert_equal '001', r.clipId
    assert_equal 'md', r.format
    assert_equal 'awesome.html', r.filename
    assert_equal 'article/js', r.category
  end

  def test_history_refresh_empth_data_dir
    data_dir = File.join(T.file_root, 'test_history_refresh')
    T.mkdir(data_dir)
    r = History.refresh(data_dir)
    assert_equal true, r[:ok]
    assert_equal 0, r[:clips].size
    T.remove_dir data_dir
  end

  def test_history_refresh
    data_dir = File.join(T.file_root, 'test_history_refresh')

    T.create_file(
      File.join(data_dir, 'mx-wc/article/js/cool-title/index.json'),
      JSON.generate({ id: '001',
        format: 'md',
        filename: 'awesome.html',
        category: 'foo/bar',
        tags: ['awesome'],
      })
    )

    T.create_file(
      File.join(data_dir, 'mx-wc/article/js/cool/title/index.json'),
      JSON.generate({ id: '002',
        format: 'md',
        filename: 'awesome.html',
        category: 'foo/bar',
        tags: ['nice-article', 'too-old'],
      })
    )

    r = History.refresh(data_dir)
    assert_equal true, r[:ok]
    assert_equal 2, r[:clips].size
    assert_equal 2, r[:categories].size
    assert_equal 3, r[:tags].size
    assert_equal Hash, r[:clips][0].class
    assert_equal '002', r[:clips][0][:clipId]

    T.remove_dir data_dir
  end

  def test_history_refresh_with_mx_wc_category
    data_dir = File.join(T.file_root, 'test_history_refresh')

    T.create_file(
      File.join(data_dir, 'mx-wc/box/mx-wc/cool-title/index.json'),
      JSON.generate({ id: '001',
        format: 'md',
        filename: 'awesome.html',
        category: 'foo/bar',
        tags: ['awesome'],
      })
    )

    r = History.refresh(data_dir)
    assert_equal "box/mx-wc", r[:categories][0]
    T.remove_dir data_dir
  end


end
