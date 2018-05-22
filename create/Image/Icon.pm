package Image::Icon;

use strict;
use Carp;

use constant {
    ICO_INT_SIZE      => 0x004,
    ICO_PALETTE_SIZE  => 0x400,
    ICO_PIXELMAP_SIZE => 0x400,
    ICO_MASK_SIZE     => 0x080,
    # offsets
    ICO_START         => 0x000,
    ICO_PALETTE       => 0x03e,
    ICO_PIXELMAP      => 0x43e,
    ICO_MASK          => 0x83e,
};

my $header =
    '0000010001002020'.
    '000001000800A808'.
    '0000160000002800'.
    '0000200000004000'.
    '0000010008000000'.
    '0000000000000000'.
    '0000000000000001'.
    '000000000000';

use Class::AccessorMaker {
    file => undef,
    palette => [],
    pixelmap => [],
    mask => [],
}, "new_init";

sub init {
    my $self = shift;
    $self->{palette} = [];
    push @{$self->{palette}}, [0,0,0] for 0..255;
    $self->{pixelmap} = [[]];
    push @{$self->{mask}}, [(0)x32] for 0..31;
}

sub write {
    my ($self, $file) = @_;

    open (my $fh, '>', $file) || croak $!;
    binmode $fh;

    # write header (everything before palette)
    if ($self->{header}) {
        print $fh $self->{header};
    } else {
        my @hex = ($header =~ /(..)/g);      # byte in hex
        my @dec = map { hex } @hex;          # hex to number
        print $fh map { pack 'C', $_ } @dec; # number to byte
    }

    # write palette
    foreach my $rgb (@{$self->{palette}}) {
        foreach (reverse @$rgb) {
            print $fh pack("C", $_);
        }
        print $fh "\0";
    }

    # write pixelmap
    foreach my $row (reverse @{$self->{pixelmap}}) {
        foreach (@$row) {
            print $fh pack("C", $_);
        }
    }

    # write mask
    foreach my $row (reverse @{$self->{mask}}) {
        my @row = @$row; # local copy
        for (0..3) {
            my $binaryString;
            for (0..7) {
                $binaryString .= shift @row ? 1 : 0;
            }
            print $fh pack("C", oct "0b$binaryString");
        }
    }

    close $fh;
}

sub read {
    my ($self, $file) = @_;

    open (my $fh, $file) || croak $!;
    binmode $fh;

    # read header (everything before palette)
    my $read = read $fh, $self->{header}, ICO_PALETTE;
    $read // croak $!; # error
    if (! $read) {     # eof
        close $fh;
        croak "Unexpected EOF";
    }

    # read palette
    my $data;
    $self->{palette} = [];
    for (0..255) {
        my @rgb;
        for (0..2) {
            # read rgb values
            my $read = read $fh, $data, 1;
            $read // croak $!; # error
            if (! $read) {     # eof
                close $fh;
                croak "Unexpected EOF";
            }
            unshift @rgb, unpack("C", $data); # byte to number
        }
        seek $fh, 1, 1; # skip 4th byte
        push @{$self->{palette}}, \@rgb;
    }

    # read pixelmap
    $self->{pixelmap} = [];
    for (0..31) {
        my @row;
        for (0..31) {
            # read palette index number
            my $read = read $fh, $data, 1;
            $read // croak $!; # error
            if (! $read) {     # eof
                close $fh;
                croak "Unexpected EOF";
            }
            push @row, unpack("C", $data); # byte to number
        }
        unshift @{$self->{pixelmap}}, \@row;
    }

    # read mask
    $self->{mask} = [];
    for (0..31) {
        my @row;
        for (0..3) {
            my $read = read $fh, $data, 1;
            $read // croak $!; # error
            if (! $read) {     # eof
                close $fh;
                croak "Unexpected EOF";
            }
            push @row,
                split //,         # split into bits
                sprintf "%08b",   # number to binary string
                unpack "C", $data # byte to number
            ;
        }
        unshift @{$self->{mask}}, \@row;
    }

    close $fh;
}

sub updatePalette {
    my ($self, $colors) = @_;
    my $i = 0;
    foreach (@$colors) {
        $self->{palette}->[$i++] = $_;
    }
}

1;

__END__

256 color ICO

palette: [ 3e ,  43e >
        256 * 4 byte, first 3 bytes = bgr, 4th byte = null
        sequence: left to right
pixelmap: [ 43e , 83e >
          32*32 * 1 byte palette index
          pixel sequence: left to right, last to first row
mask: [ 83e , 8be >
      32*32 bits
      same sequence as pixelmap
