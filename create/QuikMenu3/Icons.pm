package QuikMenu3::Icons;

use strict;
use Carp;
use Image::Icon;

use constant {
    ICC_INT_SIZE      => 0x004,
    ICC_HEADER        => 0x1f00_1f00,
    ICC_HEADER_SIZE   => 0x004,
    ICC_PIXELMAP_SIZE => 0x200,
    # offsets
    ICC_START         => 0x000,
    ICC_HEADER1       => 0x000,
    ICC_PIXELMAP      => 0x004,
    ICC_HEADER2       => 0x204,
    ICC_MASK          => 0x208,
};

sub new {
    my $self = bless {}, shift;
    $self->{file} = shift;
    $self->{size} = -s $self->{file} || croak "$self->{file} not found";

    open ($self->{fh}, $self->{file}) || croak $!;
    binmode $self->{fh};

    return $self;
}

sub next {
    my ($self) = @_;

    # eof
    return if tell $self->{fh} == $self->{size};

    my $icon = new Image::Icon();
    $icon->updatePalette($self->{palette});

    # skip header
    if (! seek $self->{fh}, ICC_HEADER_SIZE, 1) {
        close $self->{fh};
        return;
    }

    # read pixelmap
    $icon->{pixelmap} = $self->readPixelmap();

    # skip header
    if (! seek $self->{fh}, ICC_HEADER_SIZE, 1) {
        close $self->{fh};
        croak "Seek failed";
    }

    # read mask
    $icon->{mask} = $self->readPixelmap();
    # invert mask
    foreach my $row (@{$icon->{mask}}) {
        map { $_ = $_ ? 0 : 1 } @$row;
    }

    return $icon;
}

sub readPixelmap {
    my ($self) = @_;

    my @pixelmap;
    for (0..31) {
        my @groups;
        for (0..3) {
            my $data;
            my $read = read $self->{fh}, $data, ICC_INT_SIZE;
            $read // croak $!; # error
            if (! $read) {     # eof
                croak "Unexpected EOF at pos ". tell;
                close $self->{fh};
            }
            push @groups, [
                split //,         # split into bits
                sprintf "%032b",  # number to binary string
                unpack "N", $data # integer to number
            ];
        }
        my @row;
        for my $col (0..31) {
            my $paletteIndex;
            $paletteIndex .= $groups[$_][$col] for 0..3; # construct pixel paletteIndex
            push @row, oct "0b$paletteIndex";            # add to row, convert to number
        }
        push @pixelmap, \@row;
    }

    return \@pixelmap;
}

1;
