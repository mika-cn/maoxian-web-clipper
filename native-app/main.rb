#!/usr/bin/env ruby


require_relative 'lib/app_env'
require_relative 'lib/log'
require_relative 'lib/config'
require_relative 'lib/application'

def run
  begin
    config = Config.load('./config.yaml')
    # init logger
    log_level = nil
    case config.environment
    when 'production'
      log_level = Logger::INFO
    when 'development'
      log_level = Logger::DEBUG
    else
      log_level = Logger::DEBUG
    end

    Log.init(log_level)
    at_exit { Log.info("App exit: #{Process.pid}") }

    unless config.valid?
      if !config.data_dir_valid?
        Log.error("Config Invalid, data_dir not exist: #{config.data_dir}")
      end

      if !config.proxy_url_valid?
        Log.error("Proxy url invalid: #{config.proxy_url}")
      end

      if !config.proxy_user_valid?
        Log.error("Proxy user info invalid, or you forget to config proxy url")
      end
      exit 1
    end
    Log.info("App Start")
    Log.info("Version: #{AppEnv::APP_VERSION}")
    Log.info("Ruby Version: #{AppEnv::RUBY_VERSION}")
    Log.info("Msg handler: #{config.msg_handler}")
    Log.info("Encoding: ")
    Log.info("  Script => #{__ENCODING__}")
    Log.info("  Locale => #{Encoding.find('locale')}")
    Log.info("  Filesystem => #{Encoding.find('filesystem')}")
    Log.info("  Default external => #{Encoding.default_external}")
    Log.info("  Default internal => #{Encoding.default_internal || 'nil'}")
    Log.debug("pid: #{Process.pid}")
    Log.debug("args: #{ARGV}")

    app = Application.new(config)
    app.start
    Log.info("App Stop(naturally)")
  rescue => err
    Log.init(Logger::DEBUG)
    Log.fatal(err)
  end
end

run
