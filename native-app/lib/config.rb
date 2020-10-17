require 'yaml'
require 'fileutils'
require 'uri'
module Config
  def self.load(path)
    content = YAML.load_file(path)
    return Configuration.new(content)
  end

  class Configuration

    attr_accessor(
      :environment,
      :data_dir,
      :msg_handler,
      :proxy_url,
      :username,
      :password
    )

    def initialize(params)
      @environment = params['environment']
      @data_dir = params['data_dir']
      @msg_handler = params['msg_handler'] || 'default'
      @proxy_url = params['proxy_url']
      @username = params['username']
      @password = params['password']
      expand_data_dir_path
      set_default_environment
    end

    def valid?
      data_dir_valid? && proxy_url_valid? && proxy_user_valid?
    end

    def data_dir_valid?
      return false if data_dir === ''
      File.exist?(data_dir)
    end

    def proxy_url_valid?
      if proxy_url
        begin
          uri = URI.parse(proxy_url)
          return ['http', 'https'].include?(uri.scheme) && !uri.host.nil?
        rescue URI::InvalidURIError => e
          false
        end
      else
        true
      end
    end

    def proxy_user_valid?
      if username || password
        return !username.nil? && !password.nil? && !proxy_url.nil?
      else
        true
      end
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

  end
end
