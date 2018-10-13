#!/usr/bin/env ruby


require_relative 'lib/log'
require_relative 'lib/config'
require_relative 'lib/application'

def run
  begin
    config = Config.load('./config.yaml')
    # init logger
    log_level = ({
      'development' => Logger::DEBUG,
      'production'  => Logger::INFO
    })[config.environment]

    Log.init(log_level)
    at_exit { Log.info("App exit: #{Process.pid}") }

    unless config.valid?
      Log.error("Config Invalid, data_dir not exist: #{config.data_dir}")
      exit 1
    end
    Log.info("App Start")
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
