
require 'json'

# Native Message protocol:
#   32bit(message length) + message(utf8 encoded json)
module NativeMessage

  def self.read
    raw_len = $stdin.read(4)
    exit(0) if !raw_len
    len = raw_len.unpack("L")[0]
    msg = JSON.parse($stdin.read(len))
  end

  def self.write(hash)
    msg = JSON.generate(hash)
    len = msg.bytesize
    $stdout.write([len].pack('L'))
    $stdout.write(msg)
    $stdout.flush
  end

end
