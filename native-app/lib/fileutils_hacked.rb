
require 'fileutils'

module FileUtilsHacked
  def entries
    opts = {}
    #opts[:encoding] = ::Encoding::UTF_8 if fu_windows?
    opts[:encoding] = ::Encoding::UTF_8
    Dir.entries(path(), opts)\
      .reject {|n| n == '.' or n == '..' }\
      .map {|n| FileUtils::Entry_.new(prefix(), join(rel(), n.untaint)) }
  end

  def postorder_traverse
    if directory?
      entries().each do |ent|
        ent.postorder_traverse do |e|
          yield e
        end
      end
    end
    # ensure  This "ensure" will eat the Error that thrown by code above.
    yield self
  end
end

module FileUtils
  class Entry_
    prepend FileUtilsHacked
  end
end
