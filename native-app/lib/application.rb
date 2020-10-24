
require_relative 'log'
require_relative 'native_message'
require_relative 'msg-handler/default'
require_relative 'msg-handler/vnote_v1'

class Application

  def initialize(config)
    case config.msg_handler
    when 'vnote_v1'
      @msg_handler = MsgHandler::VnoteV1.new(config)
    else
      @msg_handler = MsgHandler::Default.new(config)
    end
  end

  def start
    while true do
      msg = NativeMessage.read
      @msg_handler.handle(msg) do |result|
        NativeMessage.write(result)
      end
    end
  end

end
