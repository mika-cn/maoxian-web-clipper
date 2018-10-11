
require 'open-uri'
require 'fileutils'
require_relative './log'
require_relative './native_message'

class Application
  VERSION = '0.1.0'

  attr_accessor :config

  def initialize(config)
    config.data_dir = File.join(config.data_dir, '/')
    @config = config
  end

  def start
    while true do
      msg = NativeMessage.read
      handle(msg)
    end
  end

  private

  def root
    config.data_dir
  end

  def handle(msg)
    Log.debug("[save] #{msg['clipId']} #{msg['type']} - #{msg['filename']}")
    case msg['type']
    when 'download.text' then download_text(msg)
    when 'download.url' then download_url(msg)
    when 'get.version' then
      NativeMessage.write({type: msg['type'], version: VERSION})
    when 'get.downloadFold' then
      NativeMessage.write({type: msg['type'], downloadFold: root})
    end
  end

  def download_text(msg)
    filename = File.join(root, msg['filename'])
    mkdir(filename)
    File.open(filename, 'w+') do |f|
      f.write(msg['text'])
    end
    NativeMessage.write({type: msg['type'], filename: filename})
    Log.debug("[Done] #{filename}")
  end

  def download_url(msg)
    begin
      filename = File.join(root, msg['filename'])
      mkdir(filename)
      File.open(filename, 'wb') do |file|
        file.write open(msg['url'], msg['headers']).read
      end
      NativeMessage.write({type: msg['type'], filename: filename})
      Log.debug("[Done] #{filename}")
    rescue Errno::ECONNREFUSED => e
      Log.error("[Connect Refused] #{msg['url']} #{e.message}")
    rescue Net::OpenTimeout => e
      Log.error("[Net openTimeout] #{msg['url']} #{e.message}")
    end
  end

  def mkdir(filename)
    dir = filename[0, filename.rindex('/')]
    unless File.exist?(dir)
      FileUtils.mkdir_p(dir)
    end
  end

end

