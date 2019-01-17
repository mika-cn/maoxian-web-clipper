require 'minitest/autorun'

require 'fileutils'
module T

  def self.clear_mx_wc
    remove_dir mx_wc_clippings
    remove_dir mx_wc_global_assets
    remove_dir mx_wc_root
  end

  def self.remove_dir(path)
    if File.exist? path
      FileUtils.remove_dir path
    end
  end

  def self.mx_wc_clippings
    File.join(mx_wc_root, 'clippings')
  end

  def self.mx_wc_global_assets
    File.join(mx_wc_root, 'global-assets')
  end

  def self.mx_wc_root
    @mx_wc_root ||= File.join(file_root, 'mx-wc')
  end

  def self.file_root
    @tmp_root ||= File.expand_path('../files', __FILE__)
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
