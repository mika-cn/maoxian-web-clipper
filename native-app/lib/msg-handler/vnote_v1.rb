
require 'json'
require_relative '../storage'
require_relative '../vnote/v1'
require_relative 'default'

module MsgHandler

  class VnoteV1

    def initialize(config)
      @config = config
      @default_handler = MsgHandler::Default.new(config)
    end

    def handle(msg, &send_msg)
      result = handle_normal_msg(msg, &send_msg)
      send_msg.call(result)
    end

    def handle_normal_msg(msg, &send_msg)
      case msg['type']
      when 'download.text' then
        download_text(msg)
      when 'clipping.op.delete' then
        return {
          type: msg['type'],
          ok: false,
          message: 'Deleting clipping is not supported'
        }
      when 'history.refresh', 'history.refresh_v2' then
        return {
          type: msg['type'],
          ok: false,
          message: 'Refreshing clipping history is not supported'
        }
      else
        # other messages are delegated to default handler
        @default_handler.handle(msg, &send_msg)
      end
    end

    def download_text(msg)
      root = @config.data_dir
      filename = File.join(root, msg['filename'])
      Log.debug("vnote: #{filename}")
      if filename.end_with? '.json'
        mxinfo = JSON.parse(msg['text'])
        result = Vnote::V1::Metas.save(mxinfo, mxinfo_filename: filename, notebook_path: root)
      else
        result = Storage.save_file(filename, msg['text'])
      end
      @default_handler.get_download_result(msg, filename, result)
    end

  end
end
