package QuikMenu3::Inf;

use strict;
use Carp;
use Class::AccessorMaker {};


sub read {
    my ($self, $file) = @_;

    my $section;
    open (my $fh, $file) || croak $!;
    my $line = <$fh>;
    $line =~ /^QuikMenu-III/ || croak "First line should be QuikMenu-III";

    $self->{sections} = {};
    while (<$fh>) {
        if (/^\[ (.+) \]$/) {
            $section = $1;
            $section =~ s/ /_/g;
        } elsif (/(.+)=(.*)/) {
            next unless $section;
            $self->{sections}->{$section}->{$1} && carp "Overwriting duplicate $self->{sections}->{$section}->{$1} for $1 in section $section";
            $self->{sections}->{$section}->{$1} = $2;
        }
    }
    close $fh;

    $self->{palette} = [];
    foreach (sort keys %{$self->{sections}->{VGA_PALETTE}}) {
        my $v = $self->{sections}->{VGA_PALETTE}->{$_};
        push @{$self->{palette}}, $self->getRGB($v);
    }
}

sub getRGB {
    # input: 18 bit number containing three 6 bit numbers
    # output: array ref containing three 8 bit numbers [r, g, b]
    my ($self, $color) = @_;

    # (unpack doesn't support arbitrary length integers)
    my $bits = sprintf "%018b", $color; # convert to bit string, 3 * 6 bits
    return join "", reverse
        map { sprintf "%02x", $_ }  # convert to hex
        map { $_*4 + int $_/16 }    # convert to 8 bit
        map { oct "0b$_" }          # convert to integer
        unpack "a6"x3, $bits;       # unpack bit string
}

1;
