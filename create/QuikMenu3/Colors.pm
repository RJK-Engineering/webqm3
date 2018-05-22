package QuikMenu3::Colors;

use strict;
use Carp;
use Class::AccessorMaker {};

sub items { qw(
    MenuBackground
    IconText
    TitleBar
    TitleText
    MenuBar
    MenuText
    StatusBar
    StatusText
    CommandButtons
    DialogInterior
    DialogFrame
    DialogText
    DialogEditBox
    DialogEditText
    ListBoxTitleBar
    ListBoxTitleText
    ListBoxInterior
    ListBoxText
    ListBoxScrollBar
    ViewerBackground
    ViewerText
    ViewerScrollBar
    EditorBackground
    EditorText
    EditorCursor
    EditorCursorText
    EditorScrollBar
    TimeLogTitleBar
    TimeLogTitleText
    TimeLogBackground
    TimeLogText
    TimeLogScrollBar
);}

sub readdir {
    my ($self, $dir) = @_;

    $self->{colors} = {};
    opendir (my $dh, $dir) || croak $!;
    while (readdir $dh) {
        next if ! /(.+)\.CLR$/;
        my $file = $1;
        open (my $fh, "$dir/$_") || croak $!;
        binmode $fh;

        my (@colors, $data);
        while (read $fh, $data, 1) {
            push @colors, unpack("C", $data);
        }
        close $fh;
        $self->{colors}->{$file} = \@colors;
    }
    closedir $dh;
}

1;
