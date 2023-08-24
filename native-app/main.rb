#!/usr/bin/env ruby


require_relative 'lib/app_env'
require_relative 'lib/log'
require_relative 'lib/config'
require_relative 'lib/native_message'
require_relative 'lib/application'

def run
  begin
    config_path = File.expand_path('../config.yaml', __FILE__)
    config = Config.load(config_path)

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
        err_msg = "Config Invalid, data_dir not exist: #{config.data_dir}"
        Log.error(err_msg)
        feedback_error(err_msg)
      end

      if !config.proxy_url_valid?
        err_msg = "Proxy url invalid: #{config.proxy_url}"
        Log.error(err_msg)
        feedback_error(err_msg)
      end

      if !config.proxy_user_valid?
        err_msg = "Proxy user info invalid, or you forget to config proxy url"
        Log.error(err_msg)
        feedback_error(err_msg)
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
    exit 0
  rescue => err
    begin
      Log.init(Logger::DEBUG)
      Log.fatal(err)
      err_msg = "FATAL: #{err.to_s}"
      feedback_error(err_msg)
    rescue => log_err
      err_msg = ["LogErr", err.to_s, log_err.to_s].join(", ")
      feedback_error(err_msg)
    end
    exit 1
  end
end

def feedback_error(errorMessage)
  msg = {type: 'nativeApp.error', error: errorMessage}
  NativeMessage.write(msg)
end


run
