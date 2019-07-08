
module History
  require 'json'

  def self.refresh(data_dir)
    data_dir = sanitize(data_dir)
    mx_wc_dir = File.join(data_dir, 'mx-wc')
    items = []
    Dir.glob("#{mx_wc_dir}/**/index.json") do |path|
      clip = parse_clipping_info_file(path)
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

  def self.parse_clipping_info_file(path)
    json = File.open(path) {|f| f.read}
    begin
      info = JSON.parse(json)
      return ClippingInfo.new(info, path)
    rescue JSON::ParserError => e
      return nil
    end
  end

  require 'ostruct'
  class ClippingInfo < OpenStruct
    MX_DIR = 'mx-wc'

    def initialize(h, path)
      store_path = to_store_path(path)
      h[:path] = File.join(MX_DIR, store_path)
      super(h)
      fix_format
      fix_filename
      fix_category(store_path)
      fix_clip_id
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

    def to_store_path(path)
      # avoid this case: mx-wc/box/mx-wc/awesome-title/index.json
      sep = "#{MX_DIR}/"
      arr = path.split(sep)
      arr.shift
      arr.join(sep)
    end

  end

end
