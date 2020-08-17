import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit,
  PLATFORM_ID,
  Inject,
  OnDestroy,
  } from "@angular/core";
  import io from "socket.io-client";
  import Peer from "simple-peer";
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  yourID = "";
  users = {};
  stream;
  receivingCall = false;
  caller = "";
  callerSignal;
  callAccepted = false;
  // userVideo: any;
  @ViewChild("userVideo", { static: true }) userVideo: ElementRef<HTMLVideoElement>;
  @ViewChild("partnerVideo", { static: true }) partnerVideo: ElementRef<HTMLVideoElement>;
  socket;

  constructor(){
  }
  ngOnInit() {
    this.socket = io.connect('http://localhost:8080/');
    navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream: MediaStream) => {
          this.stream = stream;
          this.userVideo.nativeElement.srcObject = stream;
        });
    // }
    this.socket.on("yourID", (id) => {
      this.yourID = id;
    });
    this.socket.on("allUsers", (users) => {
      this.users = users;
    });

    this.socket.on("hey", (data) => {
      this.receivingCall = true;
      this.caller = data.from;
      this.callerSignal = data.signal;
    });
  }
  onStop() {
    this.receivingCall = false;
    this.callAccepted = false;
    this.partnerVideo.nativeElement.pause();
    (this.partnerVideo.nativeElement.srcObject as MediaStream).getVideoTracks()[0].stop();
    this.partnerVideo.nativeElement.srcObject = null;
  }
  callPeer(id) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: this.stream,
    });

    peer.on('signal', (data) => {
      this.socket.emit('CallUser', {
        userToCall: id,
        signalData: data,
        from: this.yourID,
      });
    });

    peer.on('stream', (stream) => {
        this.partnerVideo.nativeElement.srcObject = stream;
    });

    this.socket.on('callAccepted', (signal) => {
      this.callAccepted = true;
      peer.signal(signal);
    });
  }
  acceptCall() {
    this.callAccepted = true;
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: this.stream,
    });
    peer.on('signal', data => {
      this.socket.emit('acceptCall', { signal: data, to: this.caller })
    })

    peer.on('stream', stream => {
      // const _video = this.partnerVideo.nativeElement;
      this.partnerVideo.nativeElement.srcObject = stream;
    });

    peer.signal(this.callerSignal);
  }
}

