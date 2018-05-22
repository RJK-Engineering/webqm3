#!perl -w

use strict;
use QuikMenu3::Icons;
use QuikMenu3::Inf;

my $datadir = "data";

#~ my $icons = new QuikMenu3::Icons('c:\games\DOS\QUIKMENU\QM_COLOR.DEF');
my $icons = new QuikMenu3::Icons("$datadir/QM_COLOR.DEF");

my $inf = new QuikMenu3::Inf();
$inf->read("QM.INF");
$icons->{palette} = $inf->{palette};

my $i = 0;
while (my $icon = $icons->next()) {
    #~ my $file = sprintf "icons/icon%04u.ico", $i;
    my $file = "icons/icon$i.ico";
    print "$file\n";
    #~ $icon->read('template.ico');
    $icon->write($file);
    #~ last;
} continue {
    $i++;
}
