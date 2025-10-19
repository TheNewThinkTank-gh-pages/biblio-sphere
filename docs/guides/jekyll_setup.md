# Jekyll setup

```BASH
brew install ruby
brew info ruby

vim ~/.zshrc

echo $PATH

gem update --system 3.5.10
gem install jekyll bundler

echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
echo 'export PATH="/opt/homebrew/lib/ruby/gems/3.3.0/bin:$PATH"' >> ~/.zshrc

source  ~/.zshrc

ruby -v
gem -v
jekyll -v

cd docs/

# Serve the docs:
bundle exec jekyll serve

bundle install

# install plugins:
bundle update
```
