
require 'net/http'
require 'open-uri'
require 'fileutils'
require 'base64'
require_relative 'app_env'
require_relative 'log'
require_relative 'native_message'
require_relative 'clipping'
require_relative 'history'

class Application

  attr_accessor :config

  def initialize(config)
    config.data_dir = File.join(config.data_dir, '/')
    @config = config
    @ruby_version_gteq_2_7_0 = AppEnv.ruby_version_gteq?('2.7.0')
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
      NativeMessage.write({type: msg['type'], version: AppEnv::APP_VERSION, rubyVersion: AppEnv::RUBY_VERSION})
    when 'get.downloadFolder' then
      NativeMessage.write({type: msg['type'], downloadFolder: root})
    when 'clipping.op.delete' then
      case (msg['version'] || '1.0')
      when '2.0'
        result = Clipping.delete_v2(root, msg)
        NativeMessage.write({type: msg['type']}.merge(result))
      when '1.0'
        result = Clipping.delete(root, msg)
        NativeMessage.write({type: msg['type']}.merge(result))
      end
    when 'history.refresh' then
      result = History.refresh(root, msg['root_folder'])
      NativeMessage.write(msg.merge(result))
    else
      Log.error("unknow message: #{msg['type']}")
      NativeMessage.write({type: msg['type'], ok: false, message: 'unknow-message' })
    end
  end

  def download_text(msg)
    filename = File.join(root, msg['filename'])
    mkdir(filename)
    File.open(filename, 'w+') do |f|
      f.write(msg['text'])
    end
    respond_download_success(msg, filename)
    Log.debug("[Done] #{filename}")
  end

  def download_url(msg)
    begin
      filename = File.join(root, msg['filename'])
      mkdir(filename)
      if msg['url'] =~ /^data:/i
        content = convert_data_url_to_bin(msg['url'])
      else
        default_timeout = 40
        options = msg['headers'].clone
        timeout = msg.fetch('timeout', default_timeout)
        options[:open_timeout] = timeout.to_i
        options[:read_timeout] = timeout.to_i
        if config.username
          options[:proxy_http_basic_authentication] = [
            config.proxy_url,
            config.username,
            config.password
          ]
        elsif config.proxy_url
          options[:proxy] = config.proxy_url
        end
        Log.debug(options.inspect)
        if @ruby_version_gteq_2_7_0
          content = URI.open(msg['url'], options).read
        else
          content = open(msg['url'], options).read
        end
      end
      File.open(filename, 'wb') {|file| file.write content}
      respond_download_success(msg, filename)
      Log.debug("[Done] #{filename}")
    rescue SocketError => e
      errmsg = "[SocketError] #{msg['url']} #{e.message}"
      Log.error(errmsg)
      respond_download_failure(msg, filename, errmsg)
    rescue Errno::ECONNREFUSED => e
      errmsg = "[Connect Refused] #{msg['url']} #{e.message}"
      Log.error(errmsg)
      respond_download_failure(msg, filename, errmsg)
    rescue ::Net::OpenTimeout => e
      errmsg = "[Net openTimeout] #{msg['url']} #{e.message}"
      Log.error(errmsg)
      respond_download_failure(msg, filename, errmsg)
    rescue OpenURI::HTTPError => e
      errmsg = "[OpenUri HTTPError] #{msg['url']} #{e.message}"
      Log.error(errmsg)
      respond_download_failure(msg, filename, errmsg)
    rescue => e
      errmsg = "[Uncatch Error: #{e.class}] #{msg['url']} #{e.message}"
      Log.fatal(errmsg)
      Log.fatal(e.backtrace.join("\n"))
      respond_download_failure(msg, filename, errmsg)
    end
  end

  def respond_download_success(msg, filename)
    NativeMessage.write({
      type: msg['type'],
      filename: filename,
      taskFilename: msg['filename'],
      failed: false
    })
  end

  def respond_download_failure(msg, filename, errmsg)
    NativeMessage.write({
      type: msg['type'],
      filename: filename,
      taskFilename: msg['filename'],
      failed: true,
      errmsg: errmsg
    })
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

