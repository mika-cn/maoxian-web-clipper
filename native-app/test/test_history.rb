require 'test_helper'
require 'history'
require 'json'

class HistoryTest < Minitest::Test

  def setup
    @root_dir = '/home/foo/Downloads'
  end

  def test_clippings_info_old_version
    info = {}
    info_path = 'clippings/article/js/2019-01-01-1122334455/index.json'
    path = File.join(@root_dir, info_path)
    r = History::ClippingInfo.new(info, path, 'clippings')
    assert_equal '1122334455', r.clipId
    assert_equal 'html', r.format
    assert_equal 'index.html', r.filename
    assert_equal 'article/js', r.category
    assert_equal info_path, r.path

    info_path = 'clippings/article/js/2019-01-01/index.json'
    path = File.join(@root_dir, info_path)
    r = History::ClippingInfo.new(info, path, 'clippings')
    assert r.clipId =~ /^00/
  end

  def test_clippings_info_curr_version
    info = {
      id: '001',
      format: 'md',
      filename: 'awesome.html',
      category: 'foo/bar'
    }
    info_path = 'clippings/article/js/2019-01-01-1122334455/index.json'
    path = File.join(@root_dir, info_path)
    r = History::ClippingInfo.new(info, path, 'clippings')
    assert_equal '1.0', r.version
    assert_equal '001', r.clipId
    assert_equal 'md', r.format
    assert_equal 'awesome.html', r.filename
    assert_equal 'article/js', r.category
    assert_nil r.to_h[:id]
  end

  def test_clippings_info_v2
    info = {
      clipId: '001',
      version: '2.0',
      format: 'html',
      mainPath: 'index.html',
      category: 'foo/bar',
      paths: ['001.json', 'index.html']
    }
    info_path = 'clippings/test/20190101/001.json';
    path = File.join(@root_dir, info_path)
    r = History::ClippingInfo.new(info, path, 'clippings')
    assert_equal 'foo/bar', r.category
  end

  def test_history_refresh_empth_data_dir
    data_dir = File.join(T.file_root, 'test_history_refresh')
    T.mkdir(data_dir)
    r = History.refresh(data_dir, 'clippings')
    assert_equal true, r[:ok]
    assert_equal 0, r[:clips].size
    T.remove_dir data_dir
  end

  def test_history_refresh
    data_dir = File.join(T.file_root, 'test_history_refresh')

    T.create_file(
      File.join(data_dir, 'clippings/article/js/cool-title/index.json'),
      JSON.generate({ id: '001',
        format: 'md',
        filename: 'awesome.html',
        category: 'foo/bar',
        tags: ['awesome'],
        title: 'awesome title',
        created_at: '2019-01-01 00:00:00',
      })
    )

    T.create_file(
      File.join(data_dir, 'clippings/article/js/cool/title/index.json'),
      JSON.generate({ id: '002',
        format: 'md',
        filename: 'awesome.html',
        category: 'foo/bar',
        tags: ['nice-article', 'too-old'],
        title: 'awesome title',
        created_at: '2019-01-01T00:00:00Z',
      })
    )

    r = History.refresh(data_dir, 'clippings')
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
      File.join(data_dir, 'clippings/box/clippings/cool-title/index.json'),
      JSON.generate({ id: '001',
        format: 'md',
        filename: 'awesome.html',
        category: 'foo/bar',
        tags: ['awesome'],
        title: 'awesome title',
        created_at: '2019-01-01 00:00:00',
      })
    )

    r = History.refresh(data_dir, 'clippings')
    assert_equal "box/clippings", r[:categories][0]
    T.remove_dir data_dir
  end

  def test_history_refresh_v2
    data_dir = File.join(T.file_root, 'test_history_refresh')
    now = Time.now
    31.times do |i|
      t = now - i * 60
      T.create_file(
        File.join(data_dir, "clippings/catA/catB/title-#{i}/index.json"),
        JSON.generate({
          version: '2.0',
          clipId: now.to_i,
          format: 'html',
          title: 'awesome title',
          category: 'catA/catB',
          tags: ['tagA'],
          created_at: t.strftime('%F %T'),
        })
      )
    end

    x = y = z = 0
    History.refresh_v2(data_dir, 'clippings', batch_size: 10) do |r|
      case r[:clips].size
      when 10
        x += 1
      when 1
        y += 1
      else
        z += 1
      end
    end

    assert_equal 3, x
    assert_equal 1, y
    assert_equal 0, z

    T.remove_dir data_dir
  end

  def teardown
    data_dir = File.join(T.file_root, 'test_history_refresh')
    T.remove_dir data_dir
  end


end
