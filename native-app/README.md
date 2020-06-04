
# Native Application

A ruby application to enhance MaoXian's abilities.

## dev
create config.yaml from config.yaml.example
create pack.yaml from pack.yaml.example

## Pack native application

Install web-ext-native-app-packer

```shell
gem install web-ext-native-app-packer
```

run this command in project root, find result in `dist/native-app`

```shell
./scripts/pack-native-app.sh
```

## install

```shell
cd dist/native-app
unzip maoxian-web-clipper-native-linux-firefox.zip -d native-app-firefox
cd native-app-firefox
./install.sh
```
