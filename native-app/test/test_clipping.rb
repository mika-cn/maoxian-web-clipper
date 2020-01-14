require 'json'
require 'test_helper'
require 'clipping'

class ClippingTest < Minitest::Test

  # ====== V1 ======

  def test_v2_info_path_overflow
    result = Clipping.delete_v2(T.mx_wc_root, {
      'path' => "/tmp/mx-wc-not-exist-folder/index.json"
    })
    assert_equal false, result[:ok]
    assert_equal 'clipping.op-error.path-overflow', result[:message]
  end

  def test_v2_info_path_not_exist
    result = Clipping.delete_v2(T.mx_wc_root, {
      'path' => "#{T.mx_wc_clippings}/not-exist-folder/index.json"
    })
    assert_equal false, result[:ok]
    assert_equal 'clipping.op-error.path-not-exist', result[:message]
  end

  def test_v2_file_path_overflow
    clipping_folder = "#{T.mx_wc_clippings}/test-000"
    T.create_file("#{clipping_folder}/meta.json", JSON.generate({
      clipId: '0000',
      paths: [
        "meta.json",
        "../../../../index.html"
      ]
    }))
    result = Clipping.delete_v2(T.mx_wc_root, {
      'path' => "#{clipping_folder}/meta.json"
    })
    assert_equal true, result[:ok]
    assert_equal '0000', result[:clip_id]
    refute_nil result[:message]
  end

  def test_v2_file_path_not_exist
    clipping_folder = "#{T.mx_wc_clippings}/test-000"
    T.create_file("#{clipping_folder}/meta.json", JSON.generate({
      clipId: '0000',
      paths: [
        "meta.json",
        "whatever.html"
      ]
    }))
    result = Clipping.delete_v2(T.mx_wc_root, {
      'path' => "#{clipping_folder}/meta.json"
    })
    assert_equal true, result[:ok]
    assert_equal '0000', result[:clip_id]
    refute_nil result[:message]
    assert_match /exist/, result[:message]
  end

  def test_v2_default_info
    clipping_folder = "#{T.mx_wc_clippings}/test-000"
    T.create_files([
      "#{clipping_folder}/index.html",
      "#{clipping_folder}/assets/image.png"
    ])
    T.create_file("#{clipping_folder}/meta.json", JSON.generate({
      clipId: '0000',
      paths: [
        "meta.json",
        "index.html",
        "assets/image.png"
      ]
    }))
    result = Clipping.delete_v2(T.mx_wc_root, {
      'path' => "#{clipping_folder}/meta.json"
    })
    assert_equal true, result[:ok]
    assert_equal '0000', result[:clip_id]
    assert_nil result[:message]
  end

  def test_v2_delete_parent_dir_when_it_is_empty
    clipping_folder = "#{T.mx_wc_clippings}/test-000"
    T.create_files([
      "#{clipping_folder}/index.html",
      "#{clipping_folder}/assets/image.png"
    ])
    T.create_file("#{clipping_folder}/meta.json", JSON.generate({
      clipId: '0000',
      paths: [
        "meta.json",
        "index.html",
        "assets/image.png"]
    }))
    result = Clipping.delete_v2(T.mx_wc_root, {
      'path' => "#{clipping_folder}/meta.json"
    })
    assert_equal true, result[:ok]
    assert_equal '0000', result[:clip_id]
    assert !File.exist?(clipping_folder)
  end

  # ====== V1 ======

  def test_given_path_overflow
    result = Clipping.delete(T.mx_wc_root, {
      'asset_folder' => "#{T.mx_wc_clippings}/test/assets",
      'path' => "/tmp/mx-wc-not-exist-folder/index.json",
      'clip_id' => '0000'
    })
    assert_equal false, result[:ok]
    assert_equal 'clipping.op-error.path-overflow', result[:message]
  end

  def test_given_path_not_exist
    result = Clipping.delete(T.mx_wc_root, {
      'asset_folder' => "#{T.mx_wc_clippings}/test/assets",
      'path' => "#{T.mx_wc_clippings}/not-exist-folder/index.json",
      'clip_id' => '0000'
    })
    assert_equal false, result[:ok]
    assert_equal 'clipping.op-error.path-not-exist', result[:message]
  end

  def test_given_asset_path_overflow
    clipping = create_clipping_with_global_asset_folder('test', '0000')
    result = Clipping.delete(T.mx_wc_root, {
      'asset_folder' => "/tmp/mx-wc-not-exist-folder/assets",
      'path' => clipping[:index_path],
      'clip_id' => '0000'
    })
    assert_equal true, result[:ok]
    assert_equal 'clipping.op-warning.asset-folder-overflow', result[:message]
  end


  def test_delete_default_asset
    clipping = create_clipping_with_default_asset_folder('test', '0000')
    result = Clipping.delete(T.mx_wc_root, {
      'asset_folder' => clipping[:asset_path],
      'path' => clipping[:index_path],
      'clip_id' => '0000'
    })
    assert result[:ok]
    assert_equal '0000', result[:clip_id]
    assert !File.exist?(clipping[:clipping_path])
  end

  def test_delete_global_asset
    clipping = create_clipping_with_global_asset_folder('global-asset', '0000')
    result = Clipping.delete(T.mx_wc_root, {
      'asset_folder' => clipping[:asset_path],
      'path' => clipping[:index_path],
      'clip_id' => '0000'
    })
    assert result[:ok]
    assert_equal '0000', result[:clip_id]
    assert !File.exist?("#{clipping[:asset_path]}/0000-style.css")
    assert !File.exist?("#{clipping[:asset_path]}/0000-image.png")
  end

  def test_delete_parent_dir_when_it_is_empty
    clipping = create_clipping_with_default_asset_folder('test', '0000')
    result = Clipping.delete(T.mx_wc_root, {
      'asset_folder' => clipping[:asset_path],
      'path' => clipping[:index_path],
      'clip_id' => '0000'
    })
    assert result[:ok]
    assert !File.exist?(clipping[:clipping_path])
    parent_dir = File.dirname clipping[:clipping_path]
    assert !File.exist?(parent_dir)
    assert File.exist?(T.mx_wc_root)
  end

  def test_keep_parent_dir_when_it_is_not_empty
    clipping1 = create_clipping_with_default_asset_folder('test1', '0001')
    clipping2 = create_clipping_with_default_asset_folder('test2', '0002')
    result = Clipping.delete(T.mx_wc_root, {
      'asset_folder' => clipping1[:asset_path],
      'path' => clipping1[:index_path],
      'clip_id' => '0001'
    })
    assert result[:ok]
    assert !File.exist?(clipping1[:clipping_path])
    assert File.exist?(clipping2[:clipping_path])
    parent_dir = File.dirname clipping1[:clipping_path]
    assert File.exist?(parent_dir)
    assert File.exist?(T.mx_wc_root)
  end

  def teardown
    T.clear_mx_wc
  end

  private

  def create_clipping_with_default_asset_folder(clipping_folder_name, clip_id)
    clipping_path = [T.mx_wc_clippings, clipping_folder_name].join('/')
    asset_path = [clipping_path, 'assets'].join('/')
    index_path = [clipping_path, 'index.json'].join('/')
    T.create_files([ index_path,
      "#{clipping_path}/index.html",
      "#{asset_path}/#{clip_id}/style.css",
      "#{asset_path}/#{clip_id}/image.png"
    ])
    return {
      clip_id: clip_id,
      asset_path: asset_path,
      index_path: index_path,
      clipping_path: clipping_path,
    }
  end

  def create_clipping_with_global_asset_folder(clipping_folder_name, clip_id)
    clipping_path = [T.mx_wc_clippings, clipping_folder_name].join('/')
    asset_path = T.mx_wc_global_assets
    index_path = [clipping_path, 'index.json'].join('/')
    T.create_files([ index_path,
      "#{clipping_path}/index.html",
      "#{asset_path}/#{clip_id}-style.css",
      "#{asset_path}/#{clip_id}-image.png"
    ])
    return {
      clip_id: clip_id,
      asset_path: asset_path,
      index_path: index_path,
      clipping_path: clipping_path,
    }
  end

end
