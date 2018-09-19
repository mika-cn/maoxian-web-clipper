require 'logger'

module Log
  LOG_PATH = File.expand_path('../../tmp/app.log', __FILE__)

  def self.init(level)
    @logger = Logger.new LOG_PATH, 'weekly'
    @logger.level = level
  end

  def self.debug(msg)
    @logger.debug(msg)
  end

  def self.info(msg)
    @logger.info(msg)
  end

  def self.warn(msg)
    @logger.warn(msg)
  end

  def self.error(msg)
    @logger.error(msg)
  end

  def self.fatal(msg)
    @logger.fatal(msg)
  end

end
