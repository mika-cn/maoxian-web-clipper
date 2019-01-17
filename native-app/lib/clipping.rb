require_relative 'fileutils_hacked'
require_relative 'log'

module Clipping

  # msg: {:asset_fold, :clip_id, :path}
  def self.delete(root, msg)
    path       = msg.fetch('path')
    clip_id    = msg.fetch('clip_id')
    asset_fold = msg.fetch('asset_fold')

    root = sanitize(root)
    path = sanitize(path)
    asset_fold = sanitize(asset_fold)

    if path_overflow?(root, path)
      return { ok: false, message: 'clipping.op-error.path-overflow' }
    else
      if File.exist?(path)
        clip_fold = File.dirname(path)
        isSucc, msg = try_perform { FileUtils.remove_dir(clip_fold) }
        if !isSucc
          return {ok: false, message: msg}
        end
        remove_empty_pdir(root, clip_fold)
        if path_overflow?(clip_fold, asset_fold)
          # asset_fold is outside of clip_fold
          if path_overflow?(root, asset_fold)
            return {ok: true, message: 'clipping.op-warning.asset-fold-overflow' }
          else
            if File.exist?(asset_fold)
              pattern = [asset_fold, "#{clip_id}-*"].join("/")
              Dir.glob(pattern) do |f|
                try_perform { FileUtils.rm f }
              end
            end
            return {ok: true, clip_id: clip_id}
          end
        else
          # asset_fold is inside of clip_fold
          return {ok: true, clip_id: clip_id}
        end
      else
        return { ok: false, message: 'clipping.op-error.path-not-exist' }
      end
    end

  end

  private

  def self.try_perform
    begin
      yield
      return [true, '']
    rescue => err
      Log.warn err
      return [false, err]
    end
  end

  def self.remove_empty_pdir(root, path)
    pdir = File.dirname(path)
    return if root == pdir
    return if path_overflow?(root, pdir)
    if is_dir_empty?(pdir)
      Dir.rmdir(pdir)
      remove_empty_pdir(root, pdir)
    end
  end

  def self.is_dir_empty?(path)
    # Dir.empty?(path) not support in ruby 2.3
    Dir.entries(path).reject{|n| '.' == n || '..' == n}.size == 0
  end

  def self.sanitize(path)
    return path.gsub("\\", "/")
  end

  def self.path_overflow?(root, path)
    return path.index(root) != 0
  end

end
