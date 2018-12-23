require 'fileutils'

module Clipping

  # msg: {:asset_fold, :clipId, :path}
  def self.delete(root, msg)
    path       = msg.fetch('path')
    clip_id    = msg.fetch('clip_id')
    asset_fold = msg.fetch('asset_fold')

    root = sanitize(root)
    path = sanitize(path)
    assert_fold = sanitize(asset_fold)

    if path_overflow?(root, path)
      return { ok: false, error: 'clipping.op-error.path-overflow' }
    else
      if File.exist?(path)
        clip_fold = File.dirname(path)
        FileUtils.remove_dir(clip_fold)
        if File.exist?(asset_fold)
          if path_overflow?(root, clip_fold)
            return {ok: false, error: 'clipping.op-error.clip-fold-overflow' }
          else
            pattern = [asset_fold, "#{clip_id}-*"].join("/")
            Dir.glob(pattern) do |f|
              FileUtils.rm f
            end
            return {ok: true}
          end
        else
          return {ok: true}
        end
      else
        return { ok: false, error: 'clipping.op-error.path-not-exist' }
      end
    end

  end

  private

  def self.sanitize(path)
    return path.gsub("\\", "/")
  end

  def self.path_overflow?(root, path)
    return path.index(root) != 0
  end

end
