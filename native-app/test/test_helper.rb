require 'minitest/autorun'

require 'fileutils'
module T

  def self.mx_wc_clippings
    [mx_wc_root, 'clippings'].join('/')
  end

  def self.mx_wc_global_assets
    [mx_wc_root, 'global-assets'].join('/')
  end

  def self.clear_mx_wc
    if File.exist? mx_wc_clippings
      FileUtils.remove_dir(mx_wc_clippings)
    end
    if File.exist? mx_wc_global_assets
      FileUtils.remove_dir(mx_wc_global_assets)
    end
  end

  def self.mx_wc_root
    @mx_wc_root ||= File.expand_path('../mx-wc', __FILE__)
  end

  def self.create_files(filenames)
    filenames.each do |filename|
      create_file(filename)
    end
  end

  def self.create_file(filename)
    mkdir(filename)
    FileUtils.touch(filename)
  end

  def self.mkdir(filename)
    dir = File.dirname(filename)
    unless File.exist?(dir)
      FileUtils.mkdir_p(dir)
    end
  end
end
