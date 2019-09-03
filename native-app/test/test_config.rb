require 'test_helper'
require 'config'

class ConfigTest < Minitest::Test

  def test_data_dir_valid
    params = { "data_dir" => "/tmp" }
    config = Config::Configuration.new(params)
    assert config.data_dir_valid?
  end

  def test_data_dir_invalid
    params = { "data_dir" => "/tmp/not-exist-dir" }
    config = Config::Configuration.new(params)
    refute config.data_dir_valid?
  end

  def test_proxy_url_valid
    params = {}
    config = Config::Configuration.new(params)
    assert config.proxy_url_valid?

    params = { "proxy_url" => "http://localhost:3000" }
    config = Config::Configuration.new(params)
    assert config.proxy_url_valid?
  end

  def test_proxy_url_invalid
    params = { "proxy_url" => "http://invalid url" }
    config = Config::Configuration.new(params)
    refute config.proxy_url_valid?

    params['proxy_url'] = 'https://'
    config = Config::Configuration.new(params)
    refute config.proxy_url_valid?

    params['proxy_url'] = 'sock://127.0.0.1:3000'
    config = Config::Configuration.new(params)
    refute config.proxy_url_valid?
  end

  def test_proxy_user_valid
    params = {}
    config = Config::Configuration.new(params)
    assert config.proxy_user_valid?

    params = {'proxy_url' => 'https://127.0.0.1', 'username' => 'test', 'password' => 'test'}
    config = Config::Configuration.new(params)
    assert config.proxy_user_valid?
  end

  def test_proxy_user_invalid
    params = {'username' => 'test'}
    config = Config::Configuration.new(params)
    refute config.proxy_user_valid?

    params = {'password' => 'test'}
    config = Config::Configuration.new(params)
    refute config.proxy_user_valid?
  end

  def test_config_valid
    params = {
      "environment" => "development",
      "data_dir" => "/tmp",
    }
    config = Config::Configuration.new(params)
    assert config.valid?

    params = {
      "environment" => "development",
      "data_dir" => "/tmp",
      "proxy_url" => "http://127.0.0.1"
    }
    config = Config::Configuration.new(params)
    assert config.valid?

    params = {
      "environment" => "development",
      "data_dir" => "/tmp",
      "proxy_url" => "http://127.0.0.1",
      "username" => "test",
      "password" => "test"
    }
    config = Config::Configuration.new(params)
    assert config.valid?
  end

  def test_config_invalid
    params = {
      "environment" => "development",
      "data_dir" => "/tmp",
      "proxy_url" => "http://127.0.0.1",
      "username" => "test",
    }
    config = Config::Configuration.new(params)
    refute config.valid?

    params = {
      "environment" => "development",
      "data_dir" => "/tmp",
      "username" => "test",
      "password" => "test"
    }
    config = Config::Configuration.new(params)
    refute config.valid?

    params = {
      "environment" => "development",
      "data_dir" => "/tmp/not-exist-dir",
      "proxy_url" => "http://127.0.0.1",
      "username" => "test",
      "password" => "test"
    }
    config = Config::Configuration.new(params)
    refute config.valid?
  end

end
