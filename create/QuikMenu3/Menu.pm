package QuikMenu3::Menu;

use strict;
use Carp;
use Class::AccessorMaker {};

sub read {
    my ($self, $file) = @_;
    $self->{pages} = [];

    my $section;
    open (my $fh, $file) || croak $!;
    my $line = <$fh> // croak;
    $line =~ /^QuikMenu-/ || croak "First line should begin with \"QuikMenu-\"";

    <$fh> // croak;
    my $pagecount = <$fh> // croak;
    chomp $pagecount;
    $pagecount =~ /^\d+$/ || croak "Invalid page count $pagecount";

    my $pagenr = 1;
    while (<$fh>) {
        my $title = substr ($_, 0, -2);
        push @{$self->{pages}}, {
            pagenr => $pagenr++,
            title => $title,
        };
        last unless --$pagecount;
    }

    while (<$fh>) {
        chomp;

        #~ my @types = qw(0 1 2 3 software page macro dialer);
        # link in page item = pause in software item
        # my @align = qw(left center right);
        my @keys = qw(
            page type fillcolor bordercolor textcolor key fontsize
            x y w h link activate edit style align icon);

        my %item; @item{@keys} = map { int } split /\s/;
        my $page = $self->{pages}->[$item{page}-1];

        for (qw(font name location command password)) {
            $item{$_} = <$fh> // croak;
            chomp $item{$_};
            delete $item{$_} if $item{$_} eq "";
        }

        push @{$page->{items}}, \%item;
    }
    close $fh;
}

1;
