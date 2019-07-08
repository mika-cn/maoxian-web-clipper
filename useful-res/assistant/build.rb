#!/usr/bin/env ruby

# Usage:
#  ./build $env
#
# env: production, development(default)

require 'yaml'
require 'json'
require 'fileutils'

module Meta
  def self.get_version(str)
    str.match(/\/\/=META version ([.0-9]+)/m)[1]
  end
end

module WebsitePlansRender
  def self.perform(yaml_str)
    yaml = YAML.load(yaml_str)
    js = renderJs(yaml["plans"])
    return [yaml["version"], js, yaml["plans"].count]
  end

  def self.renderJs(plans)
    js = <<-JS
window.websitePlans = (window.websitePlans || []).concat(
#{JSON.pretty_generate(plans)}
);
JS
  end
end

module Build
  def self.perform(output_dir, deploy_url, env)
    name_a = render_library('fuzzy-matcher.js', output_dir)
    name_b = render_library('mx-wc-tool.js', output_dir)
    name_c = render_website_plans(output_dir, env)
    to_url = ->(name) {
      [deploy_url, name].join('/') + '?t=' + Time.now.to_i.to_s
    }
    render_user_script(output_dir, {
      assistant_fuzzy_matcher: to_url.call(name_a),
      assistant_mx_wc_tool: to_url.call(name_b),
      assistant_website_plans: to_url.call(name_c),
    })
    puts 'OK!'
  end

  def self.render_user_script(output_dir, deps)
    filename = 'index.user.js'
    js = File.open(filename, 'r').read
    deps.each_pair do |name, value|
      js = js.gsub("$#{name}", value)
    end
    path = File.join(output_dir, filename)
    File.open(path, 'w',) do |f|
      f.write js
    end
  end

  def self.render_library(lib_name, output_dir)
    lib = File.open(lib_name, 'r').read
    version = Meta.get_version(lib)
    arr = lib_name.split(".")
    fname = arr.shift
    ext = arr.join('.')
    filename = ["#{fname}-v#{version}", ext].join('.')
    path = File.join(output_dir, filename)
    File.open(path, 'w') do |f|
      f.write lib
    end
    puts "[Done library] Version: #{version}, file: #{lib_name}"
    return filename
  end

  def self.render_website_plans(output_dir, env)
    name = (env == 'production' ? 'website.yaml' : 'website-dev.yaml')
    yaml = File.open(name, "r").read
    version, js, count= WebsitePlansRender.perform(yaml)
    filename = "website-plans-v#{version}.js"
    path = File.join(output_dir, filename)
    File.open(path, 'w') do |f|
      f.write js
    end
    puts "[Done website] Version: #{version}, Count: #{count}"
    return filename
  end
end

script_dir = File.expand_path('..', __FILE__)
if FileUtils.pwd != script_dir
  puts "[Error] Please execute this script in #{script_dir}"
  exit 1
end


env = (ARGV[0] || 'development')
if env == 'production'
  output_dir = 'public/dist'
  deploy_url = 'https://mika-cn.github.io/maoxian-web-clipper/assistant'
else
  output_dir = 'public/dev'
  deploy_url = 'http://dev.mika/maoxian-web-clipper/tmp/assistant'
end
Build.perform(output_dir, deploy_url, env)
