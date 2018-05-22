use QuikMenu3::Menu;
use QuikMenu3::Inf;
use QuikMenu3::Colors;
use File::JSON;

my $datadir = "data";

my $menu = new QuikMenu3::Menu();
$menu->read("$datadir/QM.MNU");
my $inf = new QuikMenu3::Inf();
$inf->read("$datadir/QM.INF");
my $colors = new QuikMenu3::Colors();
$colors->readdir($datadir);

my $conf = {};
$conf->{pages} = $menu->{pages};
$conf->{inf} = $inf->{sections};
$conf->{palette} = $inf->{palette};
$conf->{colors} = $colors->{colors};
$conf->{coloritems} = [ $colors->items ];

my $json = new File::JSON("qm.json");
$json->write($conf);

foreach (@{$menu->{pages}}) {
    next unless $_->{items};
    print "$_->{pagenr} $_->{title}";
    foreach (@{$_->{items}}) {
        print " $_->{x},$_->{y}";
    }
    print "\n";
}
