
require 'net/http'
require 'open-uri'
require 'fileutils'
require 'base64'
require_relative './log'
require_relative './native_message'
require_relative './clipping'

class Application
  VERSION = '0.1.1'

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
    when 'clipping.op.delete' then
      result = Clipping.delete(root, msg)
      NativeMessage.write({type: msg['type']}.merge(result))
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
      if msg['url'] =~ /^data:/i
        content = convert_data_url_to_bin(msg['url'])
      else
        content = open(msg['url'], msg['headers']).read
      end
      File.open(filename, 'wb') {|file| file.write content}
      NativeMessage.write({type: msg['type'], filename: filename})
      Log.debug("[Done] #{filename}")
    rescue Errno::ECONNREFUSED => e
      Log.error("[Connect Refused] #{msg['url']} #{e.message}")
    rescue ::Net::OpenTimeout => e
      Log.error("[Net openTimeout] #{msg['url']} #{e.message}")
    end
  end

  def mkdir(filename)
    dir = filename[0, filename.rindex('/')]
    unless File.exist?(dir)
      FileUtils.mkdir_p(dir)
    end
  end

  def convert_data_url_to_bin(data_url)
    # FORMAT: data:[<mime type>][;base64],<data>
    protocol, rest = data_url.split(':')
    mimeType, rest = rest.split(';')
    encode, data = rest.split(',')
    if encode == 'base64'
      Base64.decode64(data)
    else
      throw "ConvertError: unknow encode: #{encode}"
    end
  end

end

