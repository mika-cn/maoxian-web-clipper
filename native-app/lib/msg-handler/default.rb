
require_relative '../app_env'
require_relative '../log'
require_relative '../clipping'
require_relative '../history'
require_relative '../fetcher'
require_relative '../storage'

module MsgHandler

  class Default

    def initialize(config)
      config.data_dir = File.join(config.data_dir, '/')
      @config = config
    end

    def handle(msg, &send_msg)
      Log.debug("[save] #{msg['clipId']} #{msg['type']} - #{msg['filename']}")

      if msg['type'] == 'history.refresh'
        result = History.refresh(root, msg['root_folder'])
        send_msg.call(msg.merge(result))
      elsif msg['type'] == 'history.refresh_v2'
        History.refresh_v2(root, msg['root_folder'], batch_size: 300) do |result|
          send_msg.call(msg.merge(result))
        end
      else
        result = handle_normal_msg(msg)
        send_msg.call(result)
      end
    end

    def handle_normal_msg(msg)
      case msg['type']
      when 'download.text' then
        download_text(msg)
      when 'download.url' then
        download_url(msg)
      when 'get.version' then
        return {
          type: msg['type'],
          version: AppEnv::APP_VERSION,
          rubyVersion: AppEnv::RUBY_VERSION
        }
      when 'get.downloadFolder' then
        return {
          type: msg['type'],
          downloadFolder: root
        }
      when 'clipping.op.delete' then
        case (msg['version'] || '1.0')
        when '2.0'
          result = Clipping.delete_v2(root, msg)
          return {type: msg['type']}.merge(result)
        when '1.0'
          result = Clipping.delete(root, msg)
          return {type: msg['type']}.merge(result)
        end
      else
        Log.error("unknow message: #{msg['type']}")
        return {type: msg['type'], ok: false, message: 'unknow-message' }
      end
    end

    def root
      @config.data_dir
    end

    def download_text(msg)
      filename = File.join(root, msg['filename'])
      result = Storage.save_file(filename, msg['text'])
      return get_download_result(msg, filename, result)
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
      result = Storage.save_base64_encoded_file(filename, msg['content'])
      get_download_result(msg, filename, result)
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
        get_download_result(msg, filename, r)
      else
        get_download_result(msg, filename, r)
      end
    end

    def get_download_result(msg, filename, result)
      it = {
        type: msg['type'],
        filename: filename,
        taskFilename: msg['filename'],
      }
      if result.ok
        it[:failed] = false
      else
        it[:failed] = true
        it[:errmsg] = result.message
      end
      return it
    end

  end
end
