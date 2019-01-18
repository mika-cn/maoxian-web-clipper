require 'test_helper'
require 'fileutils_hacked'

class FileUtilsHackedTest < Minitest::Test
  def test_raise_correct_error
    unless fu_windows?
      T.create_files([
        [fold, 'file'].join('/')
      ])
      # rm 'x'
      File.chmod(0644, fold)
      assert_raises Errno::EACCES do
        FileUtils.remove_dir fold
      end
    end
  end

  def teardown
    unless fu_windows?
      # recover 'x'
      File.chmod(0744, fold)
      FileUtils.remove_dir fold
    end
  end

  private

  def fu_windows?
    /mswin|mingw|bccwin|emx/ =~ RUBY_PLATFORM
  end

  def fold
    @fold ||= File.join(T.file_root, 'test_file_utils')
  end
end
