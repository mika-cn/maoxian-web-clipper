
module History
  require 'json'
  require 'time'

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

  def self.refresh_v2(data_dir, root_folder, batch_size: 100, &blk)
    data_dir = sanitize(data_dir)
    storage_dir = File.join(data_dir, root_folder)
    items = []

    # get each index.json's created_at and sort them
    Dir.glob("#{storage_dir}/**/*.json") do |path|
      item = parse_created_at(path)
      items.push(item) if item
    end
    sorted_items = items.sort {|a,b| b[:t] - a[:t]}

    # parse each file
    clippings = []
    categories = []
    tags = []
    i = 0
    sorted_items.each do |it|
      clipping = parse_clipping_info_file(it[:path], root_folder)
      if !clipping.nil?
        clippings << clipping.to_h
        clipping.tags.each do |tag|
          if tags.index(tag).nil?
            tags << tag
          end
        end
        if categories.index(clipping.category).nil?
          categories << clipping.category
        end
        i += 1
        if i % batch_size == 0
          blk.call({clips: clippings, categories: [], tags: [], ok: true, completed: false})
          clippings = []
          i = 0
        end
      end
    end
    blk.call({clips: clippings, categories: categories, tags: tags, ok: true, completed: true})
  end

  private


  def self.parse_created_at(path)
    json = File.open(path, 'rb') {|f| f.read}
    # created_at default(YYYY-MM-dd hh:mm:ss) or iso8601
    result = json.match(/\"created_at\"\s*:\s*\"([0-9\+\-: TZ]+)\"/)
    if result && result[1]
      created_at = result[1]
      return {t: Time.parse(created_at).to_i, path: path}
    else
      # This is not a json file that contains created_at
      return nil
    end
  end


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
      # compatible with browser
      h[:path] = File.join(root_folder, store_path)
      super(h)
      if self.version === '2.0'
      else
        fix_version
        fix_format
        fix_filename
        fix_category(store_path)
        fix_clip_id
      end
    end

    def to_h
      # WARNING:
      # if we change info's structure,
      # we should change here too
      r = super.slice(
        :version,
        :clipId,
        :format,
        :title,
        :link,
        :path,
        :category,
        :tags,
        :created_at,
      )
      if self.mainPath
        # version 1.0 don't have mainPath attribute
        r[:mainPath] = self.mainPath
      end
      r
    end

    def fix_version
      if !self.version
        self.version = '1.0'
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
