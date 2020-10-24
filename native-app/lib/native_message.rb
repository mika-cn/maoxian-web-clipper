
require 'json'

# Native Message protocol:
#   32bit(message length) + message(utf8 encoded json)
module NativeMessage
  OUT_LIMIT = 1024 * 1024 # 1 MB

  def self.read
    raw_len = $stdin.read(4)
    exit(0) if !raw_len
    len = raw_len.unpack("L")[0]
    msg = JSON.parse($stdin.read(len))
  end

  def self.write(hash)
    msg = JSON.generate(hash)
    write_raw(msg)
  end

  # msg: JSON string
  def self.write_raw(msg)
    len = msg.bytesize
    if len <= OUT_LIMIT
      $stdout.write([len].pack('L'))
      $stdout.write(msg)
      $stdout.flush
    else
      raise "The message is too big (Max: 1 MB)"
    end
  end

end
