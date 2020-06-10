
require 'net/http'
require 'open-uri'
require_relative 'app_env'
require_relative 'log'

module Fetcher

  def self.get(url, options)
    begin
      if url =~ /^data:/i
        content = convert_data_url_to_bin(url)
      else
        Log.debug(options.inspect)
        if ruby_version_gteq_2_7_0
          content = URI.open(url, options).read
        else
          content = open(url, options).read
        end
      end
      return OpenStruct.new({ok: true, content: content})
    rescue SocketError => e
      errmsg = "[SocketError] #{msg['url']} #{e.message}"
      Log.error(errmsg)
      return OpenStruct.new({ok: false, message: errmsg})
    rescue Errno::ECONNREFUSED => e
      errmsg = "[Connect Refused] #{msg['url']} #{e.message}"
      Log.error(errmsg)
      return OpenStruct.new({ok: false, message: errmsg})
    rescue ::Net::OpenTimeout => e
      errmsg = "[Net openTimeout] #{msg['url']} #{e.message}"
      Log.error(errmsg)
      return OpenStruct.new({ok: false, message: errmsg})
    rescue OpenURI::HTTPError => e
      errmsg = "[OpenUri HTTPError] #{msg['url']} #{e.message}"
      Log.error(errmsg)
      return OpenStruct.new({ok: false, message: errmsg})
    rescue => e
      errmsg = "[Uncatch Error: #{e.class}] #{msg['url']} #{e.message}"
      Log.fatal(errmsg)
      Log.fatal(e.backtrace.join("\n"))
      return OpenStruct.new({ok: false, message: errmsg})
    end
  end


  def self.ruby_version_gteq_2_7_0
    @version_gteq_2_7_0 ||= AppEnv.ruby_version_gteq?('2.7.0')
  end

  def self.convert_data_url_to_bin(data_url)
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
