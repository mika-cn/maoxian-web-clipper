require 'test_helper'
require 'fileutils_hacked'

class FileUtilsHackedTest < Minitest::Test
  def test_raise_correct_error
    unless fu_windows?
      T.create_files([
        [folder, 'file'].join('/')
      ])
      # rm 'x'
      File.chmod(0644, folder)
      assert_raises Errno::EACCES do
        FileUtils.remove_dir folder
      end
    end
  end

  def teardown
    unless fu_windows?
      # recover 'x'
      File.chmod(0744, folder)
      FileUtils.remove_dir folder
    end
  end

  private

  def fu_windows?
    /mswin|mingw|bccwin|emx/ =~ RUBY_PLATFORM
  end

  def folder
    @folder ||= File.join(T.file_root, 'test_file_utils')
  end
end
