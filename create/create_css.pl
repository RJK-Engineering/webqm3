use QuikMenu3::Colors;
use QuikMenu3::Inf;

my $datadir = "data";

my $inf = new QuikMenu3::Inf();
$inf->read("$datadir/QM.INF");
my $colors = $inf->{sections}->{COLORS};
my $palette = $inf->{palette};

open (my $fh, ">qm_colors.css") || die $!;

foreach (QuikMenu3::Colors->items) {
    my $property;
    if ($_ eq 'DialogFrame') {
        $property = 'border-color';
    } else {
        $property = /Text$/ ? 'color' : 'background-color';
    }
    print $fh ".$_ { $property: #$palette->[$colors->{$_}]; }\n";
}

close $fh || warn $!;
