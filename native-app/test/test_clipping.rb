require 'test_helper'
require 'clipping'

class ClippingTest < Minitest::Test

  def test_given_path_overflow
    clip_id = '000'
    path = "/tmp/mx-wc-not-exist-fold/index.json"
    asset_fold = "#{T.mx_wc_clippings}/assets"
    result = Clipping.delete(T.mx_wc_root, {
      'asset_fold' => asset_fold,
      'path' => path,
      'clip_id' => clip_id
    })
    assert_equal false, result[:ok]
    assert_equal 'clipping.op-error.path-overflow', result[:error]
  end

  def test_given_path_not_exist
    clip_id = '000'
    path = "#{T.mx_wc_clippings}/not-exist-folder/index.json"
    asset_fold = "#{T.mx_wc_clippings}/assets"
    result = Clipping.delete(T.mx_wc_root, {
      'asset_fold' => asset_fold,
      'path' => path,
      'clip_id' => clip_id
    })
    assert_equal false, result[:ok]
    assert_equal 'clipping.op-error.path-not-exist', result[:error]
  end


  def test_delete_default_asset
    clip_id = '0001'
    clip_fold = 'test-default-asset'
    create_clipping_with_default_asset_fold(clip_fold)
    path = "#{T.mx_wc_clippings}/#{clip_fold}/index.json"
    asset_fold = "#{T.mx_wc_clippings}/#{clip_fold}/assets"
    result = Clipping.delete(T.mx_wc_root, {
      'asset_fold' => asset_fold,
      'path' => path,
      'clip_id' => clip_id
    })
    assert result[:ok]
    assert !File.exist?(path.gsub('/index.json', ''))
  end

  def test_delete_global_asset
    clip_id = '0002'
    clip_fold = 'test-global-asset'
    create_clipping_with_global_asset_fold(clip_fold,clip_id)
    path = "#{T.mx_wc_clippings}/#{clip_fold}/index.json"
    result = Clipping.delete(T.mx_wc_root, {
      "asset_fold" => T.mx_wc_global_assets,
      'path' => path,
      'clip_id' => clip_id
    })
    assert result[:ok]
    assert !File.exist?("#{T.mx_wc_global_assets}/#{clip_id}-style.css")
    assert !File.exist?("#{T.mx_wc_global_assets}/#{clip_id}-image.png")
  end

  def teardown
    T.clear_mx_wc
  end

  private

  def create_clipping_with_default_asset_fold(clip_fold)
    T.create_files([
      "#{T.mx_wc_clippings}/#{clip_fold}/index.html",
      "#{T.mx_wc_clippings}/#{clip_fold}/index.json",
      "#{T.mx_wc_clippings}/#{clip_fold}/assets/style.css",
      "#{T.mx_wc_clippings}/#{clip_fold}/assets/image.png"
    ])
  end

  def create_clipping_with_global_asset_fold(clip_fold, clip_id)
    T.create_files([
      "#{T.mx_wc_clippings}/#{clip_fold}/index.html",
      "#{T.mx_wc_clippings}/#{clip_fold}/index.json",
      "#{T.mx_wc_global_assets}/#{clip_id}-style.css",
      "#{T.mx_wc_global_assets}/#{clip_id}-image.png"
    ])
  end

end
