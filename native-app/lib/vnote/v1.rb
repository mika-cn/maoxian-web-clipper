
require 'json'
require 'ostruct'
require_relative '../storage'

module Vnote
  module V1
    module Metas
      META_FILENAME = '_vnote.json'

      def self.save(mxinfo, mxinfo_filename:,  notebook_path:)
        if mxinfo['version'] != '2.0'
          mesasge = "Version #{mxinfo['version']} is not supported"
          return OpenStruct.new(ok: false, message: message)
        end

        # Save file meta info to current folder (files)
        main_filename = File.expand_path("../#{mxinfo['mainPath']}", mxinfo_filename)
        meta_filename = File.expand_path("../#{META_FILENAME}", main_filename)
        meta_info = FolderMeta.load(meta_filename)
        file_meta = FileMeta.from_mxinfo(mxinfo)
        index = meta_info['files'].index do |it|
          it['name'] == file_meta['name']
        end
        if index
          meta_info['files'][index] = file_meta
        else
          meta_info['files'].push(file_meta)
        end

        r = Storage.save_file(meta_filename, JSON.pretty_generate(meta_info))
        return r if !r.ok

        # Fix meta info in folders (sub_directories)
        curr_folder_path = File.expand_path("../", meta_filename)
        names = Storage.rm_prefix(curr_folder_path, prefix: notebook_path).split('/')
        while (names.length > 1) do
          curr_name = names.pop
          meta_filename = File.join(notebook_path, *names, META_FILENAME)
          meta_info = FolderMeta.load(meta_filename)
          meta_info['sub_directories'] = \
            meta_info['sub_directories'].concat([{'name' => curr_name}]).uniq

          r = Storage.save_file(meta_filename, JSON.pretty_generate(meta_info))
          return r if !r.ok
        end

        # fix meta info in nodebook folder (tags)
        mx_root_folder = names[0]
        meta_filename = File.join(notebook_path, META_FILENAME)
        meta_info = NotebookMeta.load(meta_filename, mx_root_folder)
        meta_info['tags'] = meta_info['tags'].concat(mxinfo['tags']).uniq
        return Storage.save_file(meta_filename, JSON.pretty_generate(meta_info))
      end
    end

    module FileMeta
      def self.from_mxinfo(mxinfo)
        {
          'attachment_folder' => '',
          'attachments'       => [],
          'created_time'      => Util.toISO8601(mxinfo['created_at']),
          'name'              => mxinfo['mainPath'].split('/').pop,
          'tags'              => mxinfo['tags'],
        }
      end
    end

    module FolderMeta
      def self.default
        {
          'version'         => '1',
          'created_time'    => Util.now,
          'files'           => [],
          'sub_directories' => []
        }
      end

      def self.load(path)
        if File.exist? path
          content = JSON.parse(File.read(path))
        else
          content = default
        end
      end
    end

    module NotebookMeta

      def self.default(mx_root_folder)
        {
          "version"            => "1",
          "attachment_folder"  => "_v_attachments",
          "image_folder"       => "",
          "recycle_bin_folder" => "_v_recycle_bin",
          "files"              => [],
          "sub_directories"    => [ { "name" => mx_root_folder } ],
          "tags"               => [],
          "created_time"       => Util.now
        }
      end

      def self.load(path, mx_root_folder)
        if File.exist? path
          content = JSON.parse(File.read(path))
        else
          content = default(mx_root_folder)
        end
      end
    end

    module Util

      def self.now
        Time.now.utc.strftime('%FT%TZ')
      end

      # timestr: '2010-03-07 15:05:55'
      # return '2010-03-07T07:05:55Z'
      def self.toISO8601(timestr)
        params = timestr.split(/[\-:\s]/).map(&:to_i)
        Time.new(*params).utc.strftime('%FT%TZ')
      end
    end
  end

end
