
require_relative 'app_env'
require_relative 'log'
require_relative 'native_message'
require_relative 'clipping'
require_relative 'history'
require_relative 'fetcher'
require_relative 'storage'

class Application

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
    r = Storage.save_file(filename, msg['text'])
    if r.ok
      respond_save_success(msg, filename)
    else
      respond_save_failure(msg, filename, r.message)
    end
    Log.debug("[Done] #{filename}")
  end

  def download_url(msg)
    if msg['encode'] == 'base64' && msg['content']
      save_base64_encoded_file(msg)
    else
      # Compatible with old message
      fetch_and_save(msg)
    end
  end

  def save_base64_encoded_file(msg)
    filename = File.join(root, msg['filename'])
    r = Storage.save_base64_encoded_file(filename, msg['content'])
    if r.ok
      respond_save_success(msg, filename)
      Log.debug("[Done] #{filename}")
    else
      respond_save_failure(msg, filename, r.message)
    end
  end

  #
  # Deprecated, Do not using it.
  # We'll download these urls on browser.
  # So that we can utilize browseri's cache
  # and network environment.
  #
  def fetch_and_save(msg)
    filename = File.join(root, msg['filename'])
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

    r = Fetcher.get(msg['url'], options)
    if r.ok
      r = Storage.save_file(filename, r.content)
      if r.ok
        Log.debug("[Done] #{filename}")
        respond_save_success(msg, filename)
      else
        respond_save_failure(msg, filename, r.message)
      end
    else
      respond_save_failure(msg, filename, r.message)
    end
  end

  def respond_save_success(msg, filename)
    NativeMessage.write({
      type: msg['type'],
      filename: filename,
      taskFilename: msg['filename'],
      failed: false
    })
  end

  def respond_save_failure(msg, filename, errmsg)
    NativeMessage.write({
      type: msg['type'],
      filename: filename,
      taskFilename: msg['filename'],
      failed: true,
      errmsg: errmsg
    })
  end

end

