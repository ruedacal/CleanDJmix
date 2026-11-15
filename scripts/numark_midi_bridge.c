#include <CoreMIDI/CoreMIDI.h>
#include <CoreFoundation/CoreFoundation.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>

static int g_udp_sock = -1;
static struct sockaddr_in g_dest_addr;

void readProc(const MIDIPacketList *pktlist, void *readProcRefCon, void *srcConnRefCon) {
    const MIDIPacket *packet = &pktlist->packet[0];
    for (UInt32 i = 0; i < pktlist->numPackets; ++i) {
        if (packet->length >= 1) {
            char buffer[256];
            unsigned char st = packet->data[0];
            unsigned char ch = st & 0x0F;
            unsigned char type = st & 0xF0;
            unsigned char note = packet->length > 1 ? packet->data[1] : 0;
            unsigned char vel = packet->length > 2 ? packet->data[2] : 0;

            int n = snprintf(buffer, sizeof(buffer), "MIDI ch=%u type=0x%02X status=0x%02X note=%u vel=%u\n",
                             ch, type, st, note, vel);
            printf("%s", buffer);
            fflush(stdout);
            if (g_udp_sock >= 0) {
                sendto(g_udp_sock, buffer, n, 0, (struct sockaddr *)&g_dest_addr, sizeof(g_dest_addr));
            }
        }
        packet = MIDIPacketNext(packet);
    }
}

int main(int argc, char **argv) {
    int port = 9099;
    if (argc > 1) {
        port = atoi(argv[1]);
    }

    g_udp_sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (g_udp_sock >= 0) {
        memset(&g_dest_addr, 0, sizeof(g_dest_addr));
        g_dest_addr.sin_family = AF_INET;
        g_dest_addr.sin_port = htons(port);
        inet_pton(AF_INET, "127.0.0.1", &g_dest_addr.sin_addr);
    }

    MIDIClientRef client;
    MIDIPortRef inPort;
    OSStatus err1 = MIDIClientCreate(CFSTR("NumarkMidiBridge"), NULL, NULL, &client);
    OSStatus err2 = MIDIInputPortCreate(client, CFSTR("InPort"), readProc, NULL, &inPort);

    if (err1 != noErr || err2 != noErr) {
        fprintf(stderr, "Error creating CoreMIDI client or port\n");
        return 1;
    }

    ItemCount numSources = MIDIGetNumberOfSources();
    int connected = 0;
    for (ItemCount i = 0; i < numSources; ++i) {
        MIDIEndpointRef src = MIDIGetSource(i);
        CFStringRef name = NULL;
        MIDIObjectGetStringProperty(src, kMIDIPropertyName, &name);
        char buf[128] = {0};
        if (name) {
            CFStringGetCString(name, buf, sizeof(buf), kCFStringEncodingUTF8);
            CFRelease(name);
        }
        // Auto-conectar a Numark NV, Pioneer, DDJ o genéricos
        if (strstr(buf, "NV") || strstr(buf, "Numark") || strstr(buf, "Control") || 
            strstr(buf, "DDJ") || strstr(buf, "FLX") || strstr(buf, "Traktor") || strstr(buf, "DJ")) {
            MIDIPortConnectSource(inPort, src, NULL);
            printf("CONNECTED: %s\n", buf);
            connected++;
        }
    }
    fflush(stdout);

    if (connected == 0 && numSources > 0) {
        // Fallback: conectar a todos los sources disponibles
        for (ItemCount i = 0; i < numSources; ++i) {
            MIDIPortConnectSource(inPort, MIDIGetSource(i), NULL);
        }
    }

    CFRunLoopRun();
    return 0;
}
