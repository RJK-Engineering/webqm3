#!perl -w

use strict;
use warnings;
use QuikMenu3::Icons;
use QuikMenu3::Inf;

my $outdir = ".";
my $qminf = "data/QM.INF";
#~ my $icondef = "c:/games/DOS/QUIKMENU/QM_COLOR.DEF";
my $icondef = "data/QM_COLOR.DEF";

my $inf = new QuikMenu3::Inf();
$inf->read($qminf);

my $icons = new QuikMenu3::Icons($icondef);
$icons->{palette} = $inf->{palette};

my $i = 0;
while (my $icon = $icons->next()) {
    my $file = "$outdir/icon$i.ico";
    print "$file\n";
    # $icon->read('..\work\icons\template.ico');
    $icon->write($file);
    last;
} continue {
    $i++;
}
