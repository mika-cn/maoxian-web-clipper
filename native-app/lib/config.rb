require 'yaml'
require 'fileutils'
module Config
  def self.load(path)
    content = YAML.load_file(path)
    return Configuration.new(content)
  end

  class Configuration
    attr_accessor :environment, :data_dir
    def initialize(params)
      @environment = params['environment']
      @data_dir = params['data_dir']
      expand_data_dir_path
      set_default_environment
    end

    def valid?
      data_dir_valid?
    end

    private

    def expand_data_dir_path
      if data_dir && data_dir.length > 0
        @data_dir = File.expand_path(data_dir, FileUtils.pwd)
      end
    end

    def set_default_environment
      unless ['production', 'development'].include?(environment)
        @environment = 'production'
      end
    end

    def data_dir_valid?
      return false if data_dir === ''
      File.exist?(data_dir)
    end
  end
end
