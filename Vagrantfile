$setup = <<SETUP
export LC_ALL=en_US.UTF-8

debconf-set-selections <<< 'mysql-server mysql-server/root_password password 0000'
debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password 0000'

apt-get install -y nginx mysql-server php5-fpm php5-cli php5-mysql

if [ ! -L /usr/share/nginx/juxta ]; then
  ln -s /home/vagrant/juxta /usr/share/nginx/juxta
fi

echo "server {\n\tlisten 8080;\n\troot /usr/share/nginx/juxta;\n\tlocation ~ \\.php$ {\n\t\tfastcgi_pass unix:/var/run/php5-fpm.sock;\n\t\tinclude fastcgi_params;\n\t}\n}" > /etc/nginx/sites-available/juxta

ln -sf /etc/nginx/sites-available/juxta  /etc/nginx/sites-enabled/

service nginx restart

wget -nv http://downloads.mysql.com/docs/sakila-db.tar.gz
tar xzvf sakila-db.tar.gz
mysql -uroot -p0000 < sakila-db/sakila-schema.sql
mysql -uroot -p0000 < sakila-db/sakila-data.sql

SETUP

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/trusty64"
  config.ssh.shell = "bash -c 'BASH_ENV=/etc/profile exec bash'"
  config.vm.network "forwarded_port", guest: 8080, host: 8080
  config.vm.synced_folder "./", "/home/vagrant/juxta"
  config.vm.provision "shell", inline: $setup
end
