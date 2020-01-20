
module History
  require 'json'

  def self.refresh(data_dir, root_folder)
    data_dir = sanitize(data_dir)
    storage_dir = File.join(data_dir, root_folder)
    items = []
    Dir.glob("#{storage_dir}/**/*.json") do |path|
      clip = parse_clipping_info_file(path, root_folder)
      if !clip.nil?
        items << {t: clip.clipId.to_i, clip: clip}
      end
    end
    result = parse_items(items.sort {|a,b| b[:t] - a[:t]})
    result[:ok] = true
    result
  end

  private



  def self.parse_items(items)
    clips = []
    categories = []
    tags = []
    items.each do |it|
      clip = it[:clip]
      clips << clip.to_h
      clip.tags.each do |tag|
        if tags.index(tag).nil?
          tags << tag
        end
      end
      if categories.index(clip.category).nil?
        categories << clip.category
      end
    end
    return { clips: clips, categories: categories, tags: tags }
  end


  def self.sanitize(path)
    path.gsub("\\", '/')
  end

  def self.parse_clipping_info_file(path, root_folder)
    json = File.open(path) {|f| f.read}
    begin
      info = JSON.parse(json)
      if is_clipping_info_file?(info)
        return ClippingInfo.new(info, path, root_folder)
      else
        return nil
      end
    rescue JSON::ParserError => e
      return nil
    end
  end

  def self.is_clipping_info_file?(h)
    return ['created_at', 'title', 'category', 'tags'].all? do |k|
      h.keys.include?(k)
    end
  end

  require 'ostruct'
  class ClippingInfo < OpenStruct

    def initialize(h, path, root_folder)
      store_path = to_store_path(path, root_folder)
      h[:path] = File.join(root_folder, store_path)
      super(h)
      if self.version === '2.0'
      else
        fix_format
        fix_filename
        fix_category(store_path)
        fix_clip_id
      end
    end

    def fix_format
      if !self.format
        self.format = 'html'
      end
    end

    def fix_filename
      if !filename
        self.filename = "index.#{format}"
      end
    end

    # user may change clipping folder
    def fix_category(store_path)
      self.category = store_path.split('/')[0...-2].join('/')
    end

    def fix_clip_id
      if !clipId
        if id
          self.clipId = id
        else
          ms_reg_exp = /-(\d{9,})\//
          if path =~ ms_reg_exp
            self.clipId = path.match(ms_reg_exp)[1]
          else
            self.clipId = '00' + (Random.rand * 10000000).round.to_s
          end
        end
      end
    end

    def to_store_path(path, root_folder)
      # avoid this case: root_folder/box/root_folder/awesome-title/index.json
      sep = "#{root_folder}/"
      arr = path.split(sep)
      arr.shift
      arr.join(sep)
    end

  end

end
