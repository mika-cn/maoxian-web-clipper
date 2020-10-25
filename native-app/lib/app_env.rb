
module AppEnv
  APP_VERSION = '0.2.7'
  RUBY_VERSION = defined?(RUBY_VERSION) ? RUBY_VERSION : VERSION

  def self.ruby_version_gteq?(version)
    @ruby_version ||= AppEnv::Version.new AppEnv::RUBY_VERSION
    @ruby_version.gteq?(version)
  end

  class Version
    attr_reader :major, :minor, :micro, :tail

    def initialize(version)
      major, minor, micro, tail = extract(version)
      @major = major || 0
      @minor = minor || 0
      @micro = micro || 0
      @tail  = tail || 0
    end

    def gteq?(other)
      if other.is_a? String
        other = AppEnv::Version.new(other)
      end
      unless other.is_a? AppEnv::Version
        raise new Error("other should be a string or a AppEnv::Version object.")
      end
      return major >= other.major && minor >= other.minor && micro >= other.micro && tail  >= other.tail
    end

    private

    def extract(version)
      version.split('.').map {|it| it.to_i}
    end
  end

end
