require 'test_helper'
require 'fileutils_hacked'

class FileUtilsHackedTest < Minitest::Test
  def test_raise_correct_error
    T.create_files([
      [fold, 'file'].join('/')
    ])
    # rm 'x'
    File.chmod(0644, fold)
    assert_raises Errno::EACCES do
      FileUtils.remove_dir fold
    end
  end

  def teardown
    # recover 'x'
    File.chmod(0744, fold)
    FileUtils.remove_dir fold
  end

  private

  def fold
    @fold ||= File.join(T.file_root, 'test_file_utils')
  end
end
