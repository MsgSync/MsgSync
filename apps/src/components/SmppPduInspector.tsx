import React, { useState, useEffect, useMemo } from 'react';
import { SmppTrunk } from '../types';
import { INITIAL_SMPP_TRUNKS } from '../data/mockData';

export type PduDirection = 'INCOMING' | 'OUTGOING';

export interface SmppPdu {
  id: string;
  timestamp: string;
  trunkId: string;
  trunkName: string;
  direction: PduDirection; // INCOMING (RX) or OUTGOING (TX)
  commandLength: number;
  commandIdHex: string;
  commandName: string;
  commandStatusHex: string;
  commandStatusDesc: string;
  sequenceNumber: number;
  // Mandatory body
  serviceType: string;
  sourceAddrTon: number;
  sourceAddrNpi: number;
  sourceAddr: string;
  destAddrTon: number;
  destAddrNpi: number;
  destAddr: string;
  esmClassHex: string;
  protocolId: number;
  priorityFlag: number;
  scheduleDeliveryTime: string;
  validityPeriod: string;
  registeredDeliveryHex: string;
  replaceIfPresentFlag: number;
  dataCodingHex: string;
  dataCodingDesc: string;
  smDefaultMsgId: number;
  smLength: number;
  shortMessage: string;
  messageId?: string; // for submit_sm_resp / deliver_sm
  // Optional TLVs
  tlvs?: { tagHex: string; tagName: string; length: number; valueHex: string; valueDecoded: string }[];
  // Raw Hex Dump
  rawHex: string;
  latencyMs: number;
}

interface SmppPduInspectorProps {
  onShowToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onNavigateToTrunks?: () => void;
}

// Sample realistic SMPP PDUs generator
const generatePduTemplates = (): SmppPdu[] => [
  {
    id: 'pdu-seed-1',
    timestamp: new Date().toISOString().substring(11, 23),
    trunkId: 'trunk-01',
    trunkName: 'Twilio Direct US',
    direction: 'OUTGOING',
    commandLength: 104,
    commandIdHex: '0x00000004',
    commandName: 'submit_sm',
    commandStatusHex: '0x00000000',
    commandStatusDesc: 'ESME_ROK (No Error)',
    sequenceNumber: 104928,
    serviceType: 'OTP',
    sourceAddrTon: 5, // Alphanumeric
    sourceAddrNpi: 0,
    sourceAddr: 'VERIFY',
    destAddrTon: 1, // International
    destAddrNpi: 1, // ISDN / E.164
    destAddr: '+12025550199',
    esmClassHex: '0x00',
    protocolId: 0,
    priorityFlag: 1,
    scheduleDeliveryTime: '',
    validityPeriod: '',
    registeredDeliveryHex: '0x01', // Delivery Receipt requested
    replaceIfPresentFlag: 0,
    dataCodingHex: '0x00',
    dataCodingDesc: 'SMSC Default Alphabet (GSM 7-bit)',
    smDefaultMsgId: 0,
    smLength: 48,
    shortMessage: 'Your GlobalTel security PIN is 849201. Valid 5m.',
    tlvs: [
      { tagHex: '0x020C', tagName: 'sar_msg_ref_num', length: 2, valueHex: '0x002B', valueDecoded: 'Ref: 43' },
      { tagHex: '0x020E', tagName: 'sar_total_segments', length: 1, valueHex: '0x01', valueDecoded: '1 segment' },
      { tagHex: '0x020F', tagName: 'sar_segment_seqnum', length: 1, valueHex: '0x01', valueDecoded: 'Seq: 1' },
    ],
    rawHex:
      '000000680000000400000000000199e04f54500005005645524946590001012b31323032353535303139390000000100000100000030596f757220476c6f62616c54656c2073656375726974792050494e206973203834393230312e2056616c696420356d2e020c0002002b020e000101020f000101',
    latencyMs: 11.4,
  },
  {
    id: 'pdu-seed-2',
    timestamp: new Date().toISOString().substring(11, 23),
    trunkId: 'trunk-01',
    trunkName: 'Twilio Direct US',
    direction: 'INCOMING',
    commandLength: 33,
    commandIdHex: '0x80000004',
    commandName: 'submit_sm_resp',
    commandStatusHex: '0x00000000',
    commandStatusDesc: 'ESME_ROK (Accepted by SMSC)',
    sequenceNumber: 104928,
    serviceType: '',
    sourceAddrTon: 0,
    sourceAddrNpi: 0,
    sourceAddr: '',
    destAddrTon: 0,
    destAddrNpi: 0,
    destAddr: '',
    esmClassHex: '0x00',
    protocolId: 0,
    priorityFlag: 0,
    scheduleDeliveryTime: '',
    validityPeriod: '',
    registeredDeliveryHex: '0x00',
    replaceIfPresentFlag: 0,
    dataCodingHex: '0x00',
    dataCodingDesc: 'N/A',
    smDefaultMsgId: 0,
    smLength: 0,
    shortMessage: '',
    messageId: 'GT-SMSC-98421',
    rawHex: '000000218000000400000000000199e047542d534d53432d393834323100',
    latencyMs: 9.8,
  },
  {
    id: 'pdu-seed-3',
    timestamp: new Date().toISOString().substring(11, 23),
    trunkId: 'trunk-02',
    trunkName: 'BICS Global Transit',
    direction: 'INCOMING',
    commandLength: 16,
    commandIdHex: '0x00000015',
    commandName: 'enquire_link',
    commandStatusHex: '0x00000000',
    commandStatusDesc: 'ESME_ROK (Keepalive Ping)',
    sequenceNumber: 42091,
    serviceType: '',
    sourceAddrTon: 0,
    sourceAddrNpi: 0,
    sourceAddr: '',
    destAddrTon: 0,
    destAddrNpi: 0,
    destAddr: '',
    esmClassHex: '0x00',
    protocolId: 0,
    priorityFlag: 0,
    scheduleDeliveryTime: '',
    validityPeriod: '',
    registeredDeliveryHex: '0x00',
    replaceIfPresentFlag: 0,
    dataCodingHex: '0x00',
    dataCodingDesc: 'N/A',
    smDefaultMsgId: 0,
    smLength: 0,
    shortMessage: '',
    rawHex: '0000001000000015000000000000a46b',
    latencyMs: 14.2,
  },
  {
    id: 'pdu-seed-4',
    timestamp: new Date().toISOString().substring(11, 23),
    trunkId: 'trunk-02',
    trunkName: 'BICS Global Transit',
    direction: 'OUTGOING',
    commandLength: 16,
    commandIdHex: '0x80000015',
    commandName: 'enquire_link_resp',
    commandStatusHex: '0x00000000',
    commandStatusDesc: 'ESME_ROK (Keepalive Pong)',
    sequenceNumber: 42091,
    serviceType: '',
    sourceAddrTon: 0,
    sourceAddrNpi: 0,
    sourceAddr: '',
    destAddrTon: 0,
    destAddrNpi: 0,
    destAddr: '',
    esmClassHex: '0x00',
    protocolId: 0,
    priorityFlag: 0,
    scheduleDeliveryTime: '',
    validityPeriod: '',
    registeredDeliveryHex: '0x00',
    replaceIfPresentFlag: 0,
    dataCodingHex: '0x00',
    dataCodingDesc: 'N/A',
    smDefaultMsgId: 0,
    smLength: 0,
    shortMessage: '',
    rawHex: '0000001080000015000000000000a46b',
    latencyMs: 1.1,
  },
  {
    id: 'pdu-seed-5',
    timestamp: new Date().toISOString().substring(11, 23),
    trunkId: 'trunk-05',
    trunkName: 'Vodafone Europe Hub',
    direction: 'INCOMING',
    commandLength: 132,
    commandIdHex: '0x00000005',
    commandName: 'deliver_sm',
    commandStatusHex: '0x00000000',
    commandStatusDesc: 'ESME_ROK (Delivery Receipt / MO)',
    sequenceNumber: 88124,
    serviceType: '',
    sourceAddrTon: 1,
    sourceAddrNpi: 1,
    sourceAddr: '+447700900144',
    destAddrTon: 5,
    destAddrNpi: 0,
    destAddr: 'GLOBALCORP',
    esmClassHex: '0x04', // SMSC Delivery Receipt
    protocolId: 0,
    priorityFlag: 0,
    scheduleDeliveryTime: '',
    validityPeriod: '',
    registeredDeliveryHex: '0x00',
    replaceIfPresentFlag: 0,
    dataCodingHex: '0x00',
    dataCodingDesc: 'SMSC Default Alphabet (GSM 7-bit)',
    smDefaultMsgId: 0,
    smLength: 79,
    shortMessage: 'id:GT-SMSC-98421 sub:001 dlvrd:001 submit date:2609240540 done date:2609240541 stat:DELIVRD err:000',
    tlvs: [
      { tagHex: '0x001E', tagName: 'receipted_message_id', length: 13, valueHex: '47542d534d53432d3938343231', valueDecoded: 'GT-SMSC-98421' },
      { tagHex: '0x0427', tagName: 'message_state', length: 1, valueHex: '0x02', valueDecoded: 'DELIVERED (2)' },
    ],
    rawHex:
      '0000008400000005000000000001584c0001012b343437373030393030313434000500474c4f42414c434f5250000400000000000000004f69643a47542d534d53432d3938343231207375623a30303120646c7672643a303031207375626d697420646174653a3236303932343035343020646f6e6520646174653a3236303932343035343120737461743a44454c49565244206572723a303030001e000d47542d534d53432d39383432310427000102',
    latencyMs: 18.6,
  },
  {
    id: 'pdu-seed-6',
    timestamp: new Date().toISOString().substring(11, 23),
    trunkId: 'trunk-04',
    trunkName: 'Syniverse SS7 Gateway',
    direction: 'INCOMING',
    commandLength: 16,
    commandIdHex: '0x80000004',
    commandName: 'submit_sm_resp',
    commandStatusHex: '0x00000058',
    commandStatusDesc: 'ESME_RTHROTTLED (TPS Exceeded)',
    sequenceNumber: 104929,
    serviceType: '',
    sourceAddrTon: 0,
    sourceAddrNpi: 0,
    sourceAddr: '',
    destAddrTon: 0,
    destAddrNpi: 0,
    destAddr: '',
    esmClassHex: '0x00',
    protocolId: 0,
    priorityFlag: 0,
    scheduleDeliveryTime: '',
    validityPeriod: '',
    registeredDeliveryHex: '0x00',
    replaceIfPresentFlag: 0,
    dataCodingHex: '0x00',
    dataCodingDesc: 'N/A',
    smDefaultMsgId: 0,
    smLength: 0,
    shortMessage: '',
    rawHex: '000000108000000400000058000199e1',
    latencyMs: 24.1,
  },
];

export const SmppPduInspector: React.FC<SmppPduInspectorProps> = ({ onShowToast, onNavigateToTrunks }) => {
  const [selectedTrunkId, setSelectedTrunkId] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'INCOMING' | 'OUTGOING'>('ALL');
  const [commandFilter, setCommandFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState<'NORMAL' | 'FAST'>('NORMAL');
  const [pdus, setPdus] = useState<SmppPdu[]>(generatePduTemplates());
  const [selectedPdu, setSelectedPdu] = useState<SmppPdu | null>(pdus[0]);
  const [activeHighlightField, setActiveHighlightField] = useState<string | null>(null);
  const [isCraftModalOpen, setIsCraftModalOpen] = useState(false);

  // Forensic Session Logs Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'JSON'>('CSV');
  const [exportScope, setExportScope] = useState<'FILTERED' | 'ALL'>('FILTERED');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [includeRawHexInExport, setIncludeRawHexInExport] = useState(true);
  const [includeTlvsInExport, setIncludeTlvsInExport] = useState(true);
  const [includeAuditEnvelope, setIncludeAuditEnvelope] = useState(true);

  // Craft test PDU state
  const [craftType, setCraftType] = useState<'SUBMIT_SM' | 'SUBMIT_SM_RESP_THROTTLED' | 'ENQUIRE_LINK' | 'DELIVER_SM_DLR'>('SUBMIT_SM');
  const [craftDest, setCraftDest] = useState('+14155550188');
  const [craftSource, setCraftSource] = useState('OTP_AUTH');
  const [craftMsg, setCraftMsg] = useState('Secure token: 651902. Do not share.');

  // Live PDU Stream simulation
  useEffect(() => {
    if (!isStreaming) return;

    const intervalTime = streamSpeed === 'FAST' ? 800 : 1600;
    const interval = setInterval(() => {
      const templates = generatePduTemplates();
      const template = templates[Math.floor(Math.random() * templates.length)];
      const randomSeq = Math.floor(100000 + Math.random() * 900000);
      const randomDest = `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`;
      const randomLatency = parseFloat((8 + Math.random() * 18).toFixed(1));

      // Pick trunk
      const trunk =
        selectedTrunkId !== 'ALL'
          ? INITIAL_SMPP_TRUNKS.find((t) => t.id === selectedTrunkId) || INITIAL_SMPP_TRUNKS[0]
          : INITIAL_SMPP_TRUNKS[Math.floor(Math.random() * 6)];

      const newPdu: SmppPdu = {
        ...template,
        id: `pdu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString().substring(11, 23),
        trunkId: trunk.id,
        trunkName: trunk.name,
        sequenceNumber: randomSeq,
        destAddr: template.commandName.includes('submit_sm') ? randomDest : template.destAddr,
        latencyMs: randomLatency,
      };

      setPdus((prev) => [newPdu, ...prev.slice(0, 79)]);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isStreaming, streamSpeed, selectedTrunkId]);

  // Filtered PDUs
  const filteredPdus = useMemo(() => {
    return pdus.filter((p) => {
      if (selectedTrunkId !== 'ALL' && p.trunkId !== selectedTrunkId) return false;
      if (directionFilter !== 'ALL' && p.direction !== directionFilter) return false;
      if (commandFilter !== 'ALL' && p.commandName !== commandFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = `${p.commandName} ${p.sequenceNumber} ${p.destAddr} ${p.sourceAddr} ${p.shortMessage} ${p.commandStatusDesc}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }
      return true;
    });
  }, [pdus, selectedTrunkId, directionFilter, commandFilter, searchQuery]);

  // Selected Trunk Metadata
  const currentTrunk = useMemo(() => {
    if (selectedTrunkId === 'ALL') return null;
    return INITIAL_SMPP_TRUNKS.find((t) => t.id === selectedTrunkId) || null;
  }, [selectedTrunkId]);

  // Copy raw hex
  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    if (onShowToast) {
      onShowToast('Raw SMPP PDU octet hex copied to clipboard.', 'success');
    }
  };

  // Export Wireshark JSON Dissector format
  const handleExportJson = (pdu: SmppPdu) => {
    const payload = {
      _source: {
        layers: {
          frame: {
            'frame.time': new Date().toISOString(),
            'frame.len': pdu.commandLength,
            'frame.protocols': 'ip:tcp:smpp',
          },
          smpp: {
            'smpp.command_length': pdu.commandLength,
            'smpp.command_id': pdu.commandIdHex,
            'smpp.command_id_tree': pdu.commandName,
            'smpp.command_status': pdu.commandStatusHex,
            'smpp.command_status_tree': pdu.commandStatusDesc,
            'smpp.sequence_number': pdu.sequenceNumber,
            'smpp.source_addr_ton': pdu.sourceAddrTon,
            'smpp.source_addr_npi': pdu.sourceAddrNpi,
            'smpp.source_addr': pdu.sourceAddr,
            'smpp.dest_addr_ton': pdu.destAddrTon,
            'smpp.dest_addr_npi': pdu.destAddrNpi,
            'smpp.destination_addr': pdu.destAddr,
            'smpp.esm_class': pdu.esmClassHex,
            'smpp.data_coding': pdu.dataCodingHex,
            'smpp.short_message': pdu.shortMessage,
            'smpp.raw_hex': pdu.rawHex,
          },
        },
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smpp-pdu-seq${pdu.sequenceNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (onShowToast) {
      onShowToast(`Exported PDU #${pdu.sequenceNumber} to Wireshark JSON packet capture.`, 'info');
    }
  };

  // Helper for CSV escaping according to RFC 4180
  const escapeCsv = (val: string | number | boolean | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Export session logs as RFC 4180 CSV
  const handleExportSessionCsv = (scope: 'FILTERED' | 'ALL' = exportScope) => {
    const dataset = scope === 'FILTERED' ? filteredPdus : pdus;
    if (dataset.length === 0) {
      if (onShowToast) onShowToast('No PDU logs available in current buffer to export.', 'warning');
      return;
    }

    const headers = [
      'Timestamp',
      'Direction',
      'Trunk_Name',
      'Trunk_ID',
      'Sequence_Number',
      'Command_Name',
      'Command_ID_Hex',
      'Command_Status_Desc',
      'Command_Status_Hex',
      'Latency_ms',
      'Source_TON',
      'Source_NPI',
      'Source_Address',
      'Dest_TON',
      'Dest_NPI',
      'Dest_Address',
      'ESM_Class',
      'Registered_Delivery',
      'Data_Coding_Hex',
      'Data_Coding_Desc',
      'Message_Length_Octets',
      'Short_Message_Text',
      'SMSC_Message_ID',
      'Optional_TLVs',
      ...(includeRawHexInExport ? ['Raw_Hex_Octets'] : []),
    ];

    const rows = dataset.map((p) => {
      const tlvString =
        p.tlvs && p.tlvs.length > 0
          ? p.tlvs.map((t) => `${t.tagName}(${t.tagHex}):${t.valueDecoded}`).join('; ')
          : 'none';

      const row = [
        escapeCsv(p.timestamp),
        escapeCsv(p.direction),
        escapeCsv(p.trunkName),
        escapeCsv(p.trunkId),
        escapeCsv(p.sequenceNumber),
        escapeCsv(p.commandName),
        escapeCsv(p.commandIdHex),
        escapeCsv(p.commandStatusDesc),
        escapeCsv(p.commandStatusHex),
        escapeCsv(p.latencyMs),
        escapeCsv(p.sourceAddrTon),
        escapeCsv(p.sourceAddrNpi),
        escapeCsv(p.sourceAddr),
        escapeCsv(p.destAddrTon),
        escapeCsv(p.destAddrNpi),
        escapeCsv(p.destAddr),
        escapeCsv(p.esmClassHex),
        escapeCsv(p.registeredDeliveryHex),
        escapeCsv(p.dataCodingHex),
        escapeCsv(p.dataCodingDesc),
        escapeCsv(p.smLength),
        escapeCsv(p.shortMessage),
        escapeCsv(p.messageId || ''),
        escapeCsv(tlvString),
      ];

      if (includeRawHexInExport) {
        row.push(escapeCsv(p.rawHex));
      }

      return row.join(',');
    });

    let csvContent = [headers.join(','), ...rows].join('\r\n');
    if (includeAuditEnvelope) {
      const auditHeader = [
        `# GLOBAL_TEL SMPP v3.4 FORENSIC LOG EXPORT`,
        `# Exported_At: ${new Date().toISOString()}`,
        `# Operator: Marcus Vance (SecOps Level 4)`,
        `# Scope: ${scope} (${dataset.length} PDUs)`,
        `# Target_Trunk: ${selectedTrunkId}`,
        `# Direction_Filter: ${directionFilter}`,
        `# Command_Filter: ${commandFilter}`,
        `# Search_Query: "${searchQuery || 'NONE'}"`,
        `# Checksum_Session_Ref: SHA256-SYN-${Date.now().toString(16).toUpperCase()}`,
        `# ----------------------------------------------------------------------`,
      ].join('\r\n');
      csvContent = `${auditHeader}\r\n${csvContent}`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timeStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = `smpp-session-forensics-${scope.toLowerCase()}-${timeStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onShowToast) {
      onShowToast(`Exported ${dataset.length} SMPP PDU records to CSV forensic file.`, 'success');
    }
    setIsExportModalOpen(false);
    setIsExportMenuOpen(false);
  };

  // Export session logs as structured forensic JSON
  const handleExportSessionJson = (scope: 'FILTERED' | 'ALL' = exportScope) => {
    const dataset = scope === 'FILTERED' ? filteredPdus : pdus;
    if (dataset.length === 0) {
      if (onShowToast) onShowToast('No PDU logs available in current buffer to export.', 'warning');
      return;
    }

    const payload = {
      forensic_audit_session: {
        schema: 'SMPP_V34_FORENSIC_CAPTURE_RFC3442',
        exported_at: new Date().toISOString(),
        session_id: `SMPP-SESS-${Date.now()}`,
        security_classification: 'OFFICIAL_RESTRICTED // NOC FORENSIC DISSECTION',
        operator_callsign: 'Marcus Vance (SecOps Level 4)',
        origin_gateway: 'GlobalTel Core Signaling SGW (sctp-gw-01)',
        export_scope: scope,
        filter_criteria: {
          trunk_id: selectedTrunkId,
          direction: directionFilter,
          command: commandFilter,
          search_term: searchQuery || null,
        },
        audit_metrics: {
          total_pdus_exported: dataset.length,
          incoming_rx_count: dataset.filter((p) => p.direction === 'INCOMING').length,
          outgoing_tx_count: dataset.filter((p) => p.direction === 'OUTGOING').length,
          throttled_or_error_count: dataset.filter((p) => p.commandStatusHex !== '0x00000000').length,
          average_latency_ms: Number(
            (dataset.reduce((acc, p) => acc + p.latencyMs, 0) / (dataset.length || 1)).toFixed(2)
          ),
          min_latency_ms: dataset.length > 0 ? Math.min(...dataset.map((p) => p.latencyMs)) : 0,
          max_latency_ms: dataset.length > 0 ? Math.max(...dataset.map((p) => p.latencyMs)) : 0,
        },
      },
      pdus: dataset.map((p) => ({
        id: p.id,
        timestamp: p.timestamp,
        direction: p.direction,
        trunk: {
          id: p.trunkId,
          name: p.trunkName,
        },
        header: {
          command_length: p.commandLength,
          command_id: p.commandIdHex,
          command_name: p.commandName,
          command_status: p.commandStatusHex,
          command_status_description: p.commandStatusDesc,
          sequence_number: p.sequenceNumber,
        },
        mandatory_parameters: {
          service_type: p.serviceType,
          source_address: {
            ton: p.sourceAddrTon,
            npi: p.sourceAddrNpi,
            addr: p.sourceAddr,
          },
          destination_address: {
            ton: p.destAddrTon,
            npi: p.destAddrNpi,
            addr: p.destAddr,
          },
          esm_class: p.esmClassHex,
          registered_delivery: p.registeredDeliveryHex,
          data_coding: {
            hex: p.dataCodingHex,
            description: p.dataCodingDesc,
          },
          short_message: {
            length: p.smLength,
            payload_decoded: p.shortMessage,
          },
          smsc_message_id: p.messageId || null,
        },
        optional_tlvs: includeTlvsInExport ? p.tlvs || [] : [],
        raw_hex_octets: includeRawHexInExport ? p.rawHex : undefined,
        network_telemetry: {
          latency_ms: p.latencyMs,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timeStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = `smpp-session-forensics-${scope.toLowerCase()}-${timeStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onShowToast) {
      onShowToast(`Exported ${dataset.length} SMPP PDU records to forensic JSON archive.`, 'success');
    }
    setIsExportModalOpen(false);
    setIsExportMenuOpen(false);
  };

  // Inject Crafted PDU
  const handleInjectCraftedPdu = () => {
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const trunk =
      selectedTrunkId !== 'ALL'
        ? INITIAL_SMPP_TRUNKS.find((t) => t.id === selectedTrunkId) || INITIAL_SMPP_TRUNKS[0]
        : INITIAL_SMPP_TRUNKS[0];

    let crafted: SmppPdu;

    if (craftType === 'SUBMIT_SM') {
      crafted = {
        id: `pdu-craft-${Date.now()}`,
        timestamp: new Date().toISOString().substring(11, 23),
        trunkId: trunk.id,
        trunkName: trunk.name,
        direction: 'OUTGOING',
        commandLength: 72 + craftMsg.length,
        commandIdHex: '0x00000004',
        commandName: 'submit_sm',
        commandStatusHex: '0x00000000',
        commandStatusDesc: 'ESME_ROK (No Error)',
        sequenceNumber: randomSeq,
        serviceType: 'OTP',
        sourceAddrTon: 5,
        sourceAddrNpi: 0,
        sourceAddr: craftSource || 'TEST_AUTH',
        destAddrTon: 1,
        destAddrNpi: 1,
        destAddr: craftDest || '+12025550199',
        esmClassHex: '0x00',
        protocolId: 0,
        priorityFlag: 1,
        scheduleDeliveryTime: '',
        validityPeriod: '',
        registeredDeliveryHex: '0x01',
        replaceIfPresentFlag: 0,
        dataCodingHex: '0x00',
        dataCodingDesc: 'SMSC Default Alphabet (GSM 7-bit)',
        smDefaultMsgId: 0,
        smLength: craftMsg.length,
        shortMessage: craftMsg,
        rawHex: '0000005a0000000400000000000199f1000500544553545f415554480001012b31343135353535303138380000000100000100000021' + Buffer.from(craftMsg).toString('hex'),
        latencyMs: 8.2,
      };
    } else if (craftType === 'SUBMIT_SM_RESP_THROTTLED') {
      crafted = {
        id: `pdu-craft-${Date.now()}`,
        timestamp: new Date().toISOString().substring(11, 23),
        trunkId: trunk.id,
        trunkName: trunk.name,
        direction: 'INCOMING',
        commandLength: 16,
        commandIdHex: '0x80000004',
        commandName: 'submit_sm_resp',
        commandStatusHex: '0x00000058',
        commandStatusDesc: 'ESME_RTHROTTLED (Throttling Error / TPS Exceeded)',
        sequenceNumber: randomSeq,
        serviceType: '',
        sourceAddrTon: 0,
        sourceAddrNpi: 0,
        sourceAddr: '',
        destAddrTon: 0,
        destAddrNpi: 0,
        destAddr: '',
        esmClassHex: '0x00',
        protocolId: 0,
        priorityFlag: 0,
        scheduleDeliveryTime: '',
        validityPeriod: '',
        registeredDeliveryHex: '0x00',
        replaceIfPresentFlag: 0,
        dataCodingHex: '0x00',
        dataCodingDesc: 'N/A',
        smDefaultMsgId: 0,
        smLength: 0,
        shortMessage: '',
        rawHex: '000000108000000400000058000199f2',
        latencyMs: 14.6,
      };
    } else if (craftType === 'ENQUIRE_LINK') {
      crafted = {
        id: `pdu-craft-${Date.now()}`,
        timestamp: new Date().toISOString().substring(11, 23),
        trunkId: trunk.id,
        trunkName: trunk.name,
        direction: 'OUTGOING',
        commandLength: 16,
        commandIdHex: '0x00000015',
        commandName: 'enquire_link',
        commandStatusHex: '0x00000000',
        commandStatusDesc: 'ESME_ROK (Keepalive Ping)',
        sequenceNumber: randomSeq,
        serviceType: '',
        sourceAddrTon: 0,
        sourceAddrNpi: 0,
        sourceAddr: '',
        destAddrTon: 0,
        destAddrNpi: 0,
        destAddr: '',
        esmClassHex: '0x00',
        protocolId: 0,
        priorityFlag: 0,
        scheduleDeliveryTime: '',
        validityPeriod: '',
        registeredDeliveryHex: '0x00',
        replaceIfPresentFlag: 0,
        dataCodingHex: '0x00',
        dataCodingDesc: 'N/A',
        smDefaultMsgId: 0,
        smLength: 0,
        shortMessage: '',
        rawHex: '000000100000001500000000000199f3',
        latencyMs: 1.4,
      };
    } else {
      // DELIVER_SM DLR
      crafted = {
        id: `pdu-craft-${Date.now()}`,
        timestamp: new Date().toISOString().substring(11, 23),
        trunkId: trunk.id,
        trunkName: trunk.name,
        direction: 'INCOMING',
        commandLength: 120,
        commandIdHex: '0x00000005',
        commandName: 'deliver_sm',
        commandStatusHex: '0x00000000',
        commandStatusDesc: 'ESME_ROK (Delivery Receipt)',
        sequenceNumber: randomSeq,
        serviceType: '',
        sourceAddrTon: 1,
        sourceAddrNpi: 1,
        sourceAddr: craftDest,
        destAddrTon: 5,
        destAddrNpi: 0,
        destAddr: craftSource,
        esmClassHex: '0x04',
        protocolId: 0,
        priorityFlag: 0,
        scheduleDeliveryTime: '',
        validityPeriod: '',
        registeredDeliveryHex: '0x00',
        replaceIfPresentFlag: 0,
        dataCodingHex: '0x00',
        dataCodingDesc: 'SMSC Default Alphabet',
        smDefaultMsgId: 0,
        smLength: 68,
        shortMessage: `id:GT-${randomSeq} sub:001 dlvrd:001 stat:DELIVRD err:000 text:OK`,
        rawHex: '000000780000000500000000000199f40001012b3134313535353530313838000500544553545f41555448000400000000000000004469643a47542d313034393238207375623a30303120646c7672643a30303120737461743a44454c49565244206572723a30303020746578743a4f4b',
        latencyMs: 16.2,
      };
    }

    setPdus((prev) => [crafted, ...prev]);
    setSelectedPdu(crafted);
    setIsCraftModalOpen(false);

    if (onShowToast) {
      onShowToast(`Crafted and injected ${crafted.commandName} PDU (#${crafted.sequenceNumber}) onto ${trunk.name}.`, 'success');
    }
  };

  // Convert raw hex string to formatted 16-byte offset Wireshark view
  const formattedHexLines = useMemo(() => {
    if (!selectedPdu) return [];
    const hex = selectedPdu.rawHex.replace(/\s+/g, '');
    const lines: { offsetHex: string; hexBytes: string[]; ascii: string }[] = [];

    for (let i = 0; i < hex.length; i += 32) {
      const chunk = hex.substring(i, i + 32);
      const hexBytes: string[] = [];
      let ascii = '';

      for (let j = 0; j < chunk.length; j += 2) {
        const byteHex = chunk.substring(j, j + 2);
        hexBytes.push(byteHex);
        const charCode = parseInt(byteHex, 16);
        ascii += charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : '.';
      }

      const offsetHex = (i / 2).toString(16).padStart(4, '0');
      lines.push({ offsetHex, hexBytes, ascii });
    }

    return lines;
  }, [selectedPdu]);

  return (
    <div className="rounded-lg bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm flex flex-col w-full relative">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-[#3d494c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">troubleshoot</span>
            <h2 className="text-[15px] font-semibold text-[#dfe2ee]">
              SMPP Protocol Data Unit (PDU) Dissector &amp; Real-Time Inspector
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-code-metric bg-[#0a0e16] border border-[#3d494c] text-[#4edea3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
              SMPP v3.4 WIRESHARK PARSER
            </span>
          </div>
          <p className="text-[11px] text-[#bcc9cd] mt-0.5">
            Real-time packet dissector capturing incoming (RX) and outgoing (TX) PDUs, header fields, mandatory parameters, and optional TLVs per carrier trunk.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Forensic Logs Export Dropdown & Modal Trigger */}
          <div className="relative">
            <div className="inline-flex rounded border border-[#3d494c] bg-[#181c24] text-[11px] font-code-metric">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-l text-[#4cd7f6] hover:bg-[#262a33] hover:text-[#dfe2ee] transition-all font-semibold"
                title="Export session logs for offline forensic analysis (CSV / JSON)"
              >
                <span className="material-symbols-outlined text-[15px]">file_download</span>
                <span>Export Logs</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30">
                  CSV / JSON
                </span>
              </button>
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="px-1.5 py-1.5 border-l border-[#3d494c] text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33]"
                title="Quick export options"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isExportMenuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>

            {/* Quick Export Dropdown Menu */}
            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-md bg-[#12161f] border border-[#3d494c] shadow-2xl py-1.5 z-40 text-[11px] font-code-metric">
                <div className="px-3 py-1 border-b border-[#293240] text-[10px] text-[#869397] uppercase tracking-wider font-semibold">
                  Offline Forensic Export
                </div>

                <button
                  onClick={() => handleExportSessionCsv('FILTERED')}
                  className="w-full text-left px-3 py-1.5 text-[#dfe2ee] hover:bg-[#1f2937] hover:text-[#4cd7f6] flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-[#10b981]">table_view</span>
                    <span>Export CSV (Filtered)</span>
                  </div>
                  <span className="text-[10px] text-[#869397] group-hover:text-[#dfe2ee]">{filteredPdus.length} rows</span>
                </button>

                <button
                  onClick={() => handleExportSessionJson('FILTERED')}
                  className="w-full text-left px-3 py-1.5 text-[#dfe2ee] hover:bg-[#1f2937] hover:text-[#4cd7f6] flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-[#06b6d4]">data_object</span>
                    <span>Export JSON (Filtered)</span>
                  </div>
                  <span className="text-[10px] text-[#869397] group-hover:text-[#dfe2ee]">{filteredPdus.length} PDUs</span>
                </button>

                <div className="my-1 border-t border-[#293240]" />

                <button
                  onClick={() => handleExportSessionCsv('ALL')}
                  className="w-full text-left px-3 py-1.5 text-[#bcc9cd] hover:bg-[#1f2937] hover:text-[#dfe2ee] flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-[#869397]">inventory_2</span>
                    <span>All Buffer as CSV</span>
                  </div>
                  <span className="text-[10px] text-[#869397] group-hover:text-[#dfe2ee]">{pdus.length} rows</span>
                </button>

                <button
                  onClick={() => handleExportSessionJson('ALL')}
                  className="w-full text-left px-3 py-1.5 text-[#bcc9cd] hover:bg-[#1f2937] hover:text-[#dfe2ee] flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-[#869397]">folder_zip</span>
                    <span>All Buffer as JSON</span>
                  </div>
                  <span className="text-[10px] text-[#869397] group-hover:text-[#dfe2ee]">{pdus.length} PDUs</span>
                </button>

                <div className="my-1 border-t border-[#293240]" />

                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    setIsExportModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[#4cd7f6] hover:bg-[#1f2937] flex items-center gap-2 font-semibold"
                >
                  <span className="material-symbols-outlined text-[15px]">tune</span>
                  <span>Forensic Export Settings...</span>
                </button>
              </div>
            )}
          </div>

          {/* Inject / Craft Test PDU button */}
          <button
            onClick={() => setIsCraftModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[11px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">send_and_archive</span>
            <span>Craft / Inject PDU</span>
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => setStreamSpeed(streamSpeed === 'NORMAL' ? 'FAST' : 'NORMAL')}
            className="px-2.5 py-1.5 rounded bg-[#181c24] border border-[#3d494c] text-[11px] font-code-metric text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33]"
            title="Toggle packet stream frequency"
          >
            {streamSpeed === 'FAST' ? '⚡ 2x Speed' : '⏱ 1x Speed'}
          </button>

          {/* Pause / Play Live Stream */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`p-1.5 rounded border text-[13px] flex items-center justify-center transition-all ${
              isStreaming
                ? 'bg-[#181c24] border-[#3d494c] text-[#4edea3] hover:bg-[#262a33]'
                : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]'
            }`}
            title={isStreaming ? 'Pause real-time stream' : 'Resume real-time stream'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isStreaming ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Clear Buffer */}
          <button
            onClick={() => {
              setPdus([]);
              setSelectedPdu(null);
              if (onShowToast) onShowToast('PDU capture buffer cleared.', 'info');
            }}
            className="p-1.5 rounded bg-[#181c24] border border-[#3d494c] text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33]"
            title="Clear capture buffer"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
          </button>
        </div>
      </div>

      {/* Filter & Trunk Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3 font-code-metric text-[11px]">
        {/* Trunk Dropdown */}
        <div className="flex flex-col">
          <label className="text-[10px] text-[#869397] uppercase mb-1">Carrier Trunk Target:</label>
          <select
            value={selectedTrunkId}
            onChange={(e) => setSelectedTrunkId(e.target.value)}
            className="bg-[#0a0e16] border border-[#3d494c] rounded px-2.5 py-1.5 text-[#dfe2ee] focus:border-[#4cd7f6] outline-none"
          >
            <option value="ALL">All 12 Active Trunks (Aggregated)</option>
            {INITIAL_SMPP_TRUNKS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.carrier} • {t.mode})
              </option>
            ))}
          </select>
        </div>

        {/* Direction Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] text-[#869397] uppercase mb-1">Direction (PDU Flow):</label>
          <div className="flex p-0.5 rounded bg-[#0a0e16] border border-[#3d494c] h-[34px]">
            {(['ALL', 'INCOMING', 'OUTGOING'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setDirectionFilter(dir)}
                className={`flex-1 rounded text-[10px] font-semibold transition-all ${
                  directionFilter === dir
                    ? dir === 'INCOMING'
                      ? 'bg-[#10b981] text-[#003822]'
                      : dir === 'OUTGOING'
                      ? 'bg-[#06b6d4] text-[#00424f]'
                      : 'bg-[#3d494c] text-[#dfe2ee]'
                    : 'text-[#bcc9cd] hover:text-[#dfe2ee]'
                }`}
              >
                {dir === 'ALL' ? 'ALL' : dir === 'INCOMING' ? 'RX (In)' : 'TX (Out)'}
              </button>
            ))}
          </div>
        </div>

        {/* Command Filter */}
        <div className="flex flex-col">
          <label className="text-[10px] text-[#869397] uppercase mb-1">SMPP Command:</label>
          <select
            value={commandFilter}
            onChange={(e) => setCommandFilter(e.target.value)}
            className="bg-[#0a0e16] border border-[#3d494c] rounded px-2.5 py-1.5 text-[#dfe2ee] focus:border-[#4cd7f6] outline-none"
          >
            <option value="ALL">All Commands (submit, deliver, enquire...)</option>
            <option value="submit_sm">submit_sm (0x00000004)</option>
            <option value="submit_sm_resp">submit_sm_resp (0x80000004)</option>
            <option value="deliver_sm">deliver_sm (0x00000005)</option>
            <option value="deliver_sm_resp">deliver_sm_resp (0x80000005)</option>
            <option value="enquire_link">enquire_link (0x00000015)</option>
            <option value="enquire_link_resp">enquire_link_resp (0x80000015)</option>
          </select>
        </div>

        {/* Search Query */}
        <div className="flex flex-col">
          <label className="text-[10px] text-[#869397] uppercase mb-1">Search MSISDN / Hex / Text:</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Seq #, phone, OTP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0e16] border border-[#3d494c] rounded pl-7 pr-2.5 py-1.5 text-[#dfe2ee] focus:border-[#4cd7f6] outline-none placeholder:text-[#869397]"
            />
            <span className="material-symbols-outlined absolute left-2 top-2 text-[#869397] text-[15px]">
              search
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-[#869397] hover:text-[#dfe2ee] text-[12px]"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Trunk Quick-Status Pill if a specific trunk is selected */}
      {currentTrunk && (
        <div className="p-2 mb-3 rounded bg-[#0a0e16] border border-[#3d494c] flex flex-wrap items-center justify-between gap-3 text-[11px] font-code-metric">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[#4edea3]">
              <span className="h-2 w-2 rounded-full bg-[#4edea3] animate-pulse"></span>
              <span className="font-bold">{currentTrunk.name}</span>
            </div>
            <span className="text-[#869397]">System ID: <strong className="text-[#dfe2ee]">{currentTrunk.systemId}</strong></span>
            <span className="text-[#869397]">IP: <span className="text-[#bcc9cd]">{currentTrunk.ipAddress}:2775</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#869397]">TPS: <strong className="text-[#4cd7f6]">{currentTrunk.currentMps} / {currentTrunk.tpsLimit}</strong></span>
            <span className="text-[#869397]">Window: <strong className="text-[#dfe2ee]">{currentTrunk.windowUtilization}% ({currentTrunk.windowSize})</strong></span>
            <button
              onClick={onNavigateToTrunks}
              className="text-[10px] text-[#4cd7f6] hover:underline"
            >
              Trunk Settings →
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Live Packet Stream Table (Top / Left) & Wireshark Dissector View (Bottom / Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left Side: Real-time PDU Packet List (5 cols) */}
        <div className="xl:col-span-5 flex flex-col space-y-2">
          <div className="flex items-center justify-between text-[11px] font-code-metric pb-1 border-b border-[#3d494c]">
            <div className="flex items-center gap-2">
              <span className="text-[#869397]">
                STREAM BUFFER: <strong className="text-[#dfe2ee]">{filteredPdus.length}</strong> PDUs
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleExportSessionCsv('FILTERED')}
                  className="px-1.5 py-0.2 rounded bg-[#0a0e16] border border-[#3d494c] text-[9.5px] font-bold text-[#10b981] hover:bg-[#262a33] hover:border-[#10b981] transition-all"
                  title="Export filtered PDU logs as CSV spreadsheet"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExportSessionJson('FILTERED')}
                  className="px-1.5 py-0.2 rounded bg-[#0a0e16] border border-[#3d494c] text-[9.5px] font-bold text-[#06b6d4] hover:bg-[#262a33] hover:border-[#06b6d4] transition-all"
                  title="Export filtered PDU logs as forensic JSON archive"
                >
                  JSON
                </button>
              </div>
            </div>
            <span className="text-[10px] text-[#4edea3]">
              {isStreaming ? '● RECEIVING TELEMETRY' : '⏸ STREAM PAUSED'}
            </span>
          </div>

          <div className="h-[460px] overflow-y-auto space-y-1 pr-1 select-none font-code-metric text-[11px]">
            {filteredPdus.length === 0 ? (
              <div className="p-8 text-center text-[#869397] bg-[#12161f] rounded border border-[#3d494c]">
                <span className="material-symbols-outlined text-[32px] mb-1">filter_alt_off</span>
                <p>No SMPP PDUs matched current filter criteria.</p>
              </div>
            ) : (
              filteredPdus.map((pdu) => {
                const isSelected = selectedPdu?.id === pdu.id;
                const isError = pdu.commandStatusHex !== '0x00000000';
                const isRx = pdu.direction === 'INCOMING';

                return (
                  <div
                    key={pdu.id}
                    onClick={() => setSelectedPdu(pdu)}
                    className={`p-2 rounded border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1e2430] border-[#4cd7f6] shadow-[0_0_10px_rgba(76,215,246,0.2)]'
                        : isError
                        ? 'bg-[#2a1b1e] border-[#ef4444]/40 hover:border-[#ef4444]'
                        : 'bg-[#12161f] border-[#293240] hover:border-[#3d494c] hover:bg-[#161c28]'
                    }`}
                  >
                    {/* Top Row: Time, Direction, Command, Seq */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            isRx
                              ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                              : 'bg-[#06b6d4]/20 text-[#4cd7f6] border border-[#06b6d4]/40'
                          }`}
                        >
                          {isRx ? 'RX (In)' : 'TX (Out)'}
                        </span>
                        <span className="font-bold text-[#dfe2ee] text-[12px]">{pdu.commandName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[#869397] text-[10px]">#{pdu.sequenceNumber}</span>
                        <span className="text-[#869397] text-[10px]">{pdu.timestamp}</span>
                      </div>
                    </div>

                    {/* Middle Row: Trunk, Addr, Status */}
                    <div className="flex items-center justify-between text-[10px] text-[#bcc9cd]">
                      <span className="truncate max-w-[150px] text-[#869397]">{pdu.trunkName}</span>

                      {pdu.destAddr ? (
                        <span className="text-[#4cd7f6] font-semibold">{pdu.destAddr}</span>
                      ) : (
                        <span className="text-[#869397]">{pdu.commandLength} octets</span>
                      )}

                      <span
                        className={`text-[9px] font-bold ${
                          isError ? 'text-[#ef4444]' : 'text-[#4edea3]'
                        }`}
                      >
                        {isError ? 'THROTTLED' : 'ESME_ROK'}
                      </span>
                    </div>

                    {/* Message Preview snippet if short message exists */}
                    {pdu.shortMessage && (
                      <div className="mt-1 text-[10px] text-[#869397] truncate border-t border-[#293240] pt-1">
                        &quot;{pdu.shortMessage}&quot;
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Wireshark PDU Dissector & Hex Octet Inspector (7 cols) */}
        <div className="xl:col-span-7 rounded bg-[#12161f] border border-[#3d494c] p-3.5 flex flex-col justify-between h-[490px] overflow-hidden">
          {selectedPdu ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* PDU Details Top Toolbar */}
              <div className="flex items-start justify-between pb-2 mb-2 border-b border-[#3d494c] flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-[#4cd7f6] font-code-metric">
                      {selectedPdu.commandName} ({selectedPdu.commandIdHex})
                    </span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded font-code-metric font-bold ${
                        selectedPdu.direction === 'INCOMING'
                          ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                          : 'bg-[#06b6d4]/20 text-[#4cd7f6] border border-[#06b6d4]/40'
                      }`}
                    >
                      {selectedPdu.direction}
                    </span>
                    <span className="text-[11px] font-code-metric text-[#869397]">
                      Trunk: <strong className="text-[#dfe2ee]">{selectedPdu.trunkName}</strong>
                    </span>
                  </div>
                  <div className="text-[10px] text-[#bcc9cd] font-code-metric mt-0.5">
                    Seq: <span className="text-[#dfe2ee] font-bold">#{selectedPdu.sequenceNumber}</span> • Length:{' '}
                    <span className="text-[#dfe2ee]">{selectedPdu.commandLength} octets</span> • Latency:{' '}
                    <span className="text-[#4edea3]">{selectedPdu.latencyMs}ms</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyHex(selectedPdu.rawHex)}
                    className="px-2 py-1 rounded bg-[#1c2028] border border-[#3d494c] text-[#bcc9cd] hover:text-[#dfe2ee] text-[10px] font-code-metric flex items-center gap-1"
                    title="Copy full hex string"
                  >
                    <span className="material-symbols-outlined text-[13px]">content_copy</span>
                    <span>Copy Hex</span>
                  </button>
                  <button
                    onClick={() => handleExportJson(selectedPdu)}
                    className="px-2 py-1 rounded bg-[#1c2028] border border-[#3d494c] text-[#4cd7f6] hover:bg-[#262a33] text-[10px] font-code-metric flex items-center gap-1"
                    title="Export Wireshark-compatible JSON packet"
                  >
                    <span className="material-symbols-outlined text-[13px]">download</span>
                    <span>Wireshark JSON</span>
                  </button>
                </div>
              </div>

              {/* Middle Section: Dissected Protocol Tree + Raw Hex Dump Tabs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-y-auto flex-1 pr-1 font-code-metric text-[11px]">
                {/* Dissected Fields Tree */}
                <div className="space-y-2">
                  {/* PDU Header Section */}
                  <div className="p-2 rounded bg-[#0a0e16] border border-[#232d3d] space-y-1">
                    <span className="text-[10px] uppercase text-[#4cd7f6] font-bold block border-b border-[#232d3d] pb-0.5">
                      1. SMPP Header (16 Octets)
                    </span>
                    <div
                      onMouseEnter={() => setActiveHighlightField('commandLength')}
                      onMouseLeave={() => setActiveHighlightField(null)}
                      className="flex justify-between hover:bg-[#1f2937] px-1 rounded cursor-pointer"
                    >
                      <span className="text-[#869397]">command_length:</span>
                      <span className="text-[#dfe2ee] font-bold">{selectedPdu.commandLength} (0x{selectedPdu.commandLength.toString(16).padStart(8, '0')})</span>
                    </div>
                    <div
                      onMouseEnter={() => setActiveHighlightField('commandId')}
                      onMouseLeave={() => setActiveHighlightField(null)}
                      className="flex justify-between hover:bg-[#1f2937] px-1 rounded cursor-pointer"
                    >
                      <span className="text-[#869397]">command_id:</span>
                      <span className="text-[#4cd7f6] font-bold">{selectedPdu.commandIdHex} ({selectedPdu.commandName})</span>
                    </div>
                    <div
                      onMouseEnter={() => setActiveHighlightField('commandStatus')}
                      onMouseLeave={() => setActiveHighlightField(null)}
                      className="flex justify-between hover:bg-[#1f2937] px-1 rounded cursor-pointer"
                    >
                      <span className="text-[#869397]">command_status:</span>
                      <span className={selectedPdu.commandStatusHex !== '0x00000000' ? 'text-[#ef4444] font-bold' : 'text-[#4edea3]'}>
                        {selectedPdu.commandStatusHex} ({selectedPdu.commandStatusDesc})
                      </span>
                    </div>
                    <div
                      onMouseEnter={() => setActiveHighlightField('sequenceNumber')}
                      onMouseLeave={() => setActiveHighlightField(null)}
                      className="flex justify-between hover:bg-[#1f2937] px-1 rounded cursor-pointer"
                    >
                      <span className="text-[#869397]">sequence_number:</span>
                      <span className="text-[#dfe2ee] font-bold">{selectedPdu.sequenceNumber} (0x{selectedPdu.sequenceNumber.toString(16).padStart(8, '0')})</span>
                    </div>
                  </div>

                  {/* Mandatory Parameters Section (for submit_sm, deliver_sm) */}
                  {(selectedPdu.commandName.includes('submit_sm') || selectedPdu.commandName.includes('deliver_sm')) && (
                    <div className="p-2 rounded bg-[#0a0e16] border border-[#232d3d] space-y-1">
                      <span className="text-[10px] uppercase text-[#4edea3] font-bold block border-b border-[#232d3d] pb-0.5">
                        2. Mandatory Parameters
                      </span>
                      {selectedPdu.sourceAddr && (
                        <div
                          onMouseEnter={() => setActiveHighlightField('sourceAddr')}
                          onMouseLeave={() => setActiveHighlightField(null)}
                          className="flex justify-between hover:bg-[#1f2937] px-1 rounded cursor-pointer"
                        >
                          <span className="text-[#869397]">source_addr (TON/NPI):</span>
                          <span className="text-[#dfe2ee] font-bold">
                            &quot;{selectedPdu.sourceAddr}&quot; ({selectedPdu.sourceAddrTon}/{selectedPdu.sourceAddrNpi})
                          </span>
                        </div>
                      )}
                      {selectedPdu.destAddr && (
                        <div
                          onMouseEnter={() => setActiveHighlightField('destAddr')}
                          onMouseLeave={() => setActiveHighlightField(null)}
                          className="flex justify-between hover:bg-[#1f2937] px-1 rounded cursor-pointer"
                        >
                          <span className="text-[#869397]">destination_addr:</span>
                          <span className="text-[#4cd7f6] font-bold">{selectedPdu.destAddr}</span>
                        </div>
                      )}
                      <div className="flex justify-between px-1">
                        <span className="text-[#869397]">esm_class:</span>
                        <span className="text-[#dfe2ee]">{selectedPdu.esmClassHex} (Default SMS)</span>
                      </div>
                      <div className="flex justify-between px-1">
                        <span className="text-[#869397]">registered_delivery:</span>
                        <span className="text-[#dfe2ee]">{selectedPdu.registeredDeliveryHex} (Receipt Req)</span>
                      </div>
                      <div className="flex justify-between px-1">
                        <span className="text-[#869397]">data_coding:</span>
                        <span className="text-[#bcc9cd]">{selectedPdu.dataCodingHex} ({selectedPdu.dataCodingDesc})</span>
                      </div>
                      {selectedPdu.shortMessage && (
                        <div
                          onMouseEnter={() => setActiveHighlightField('shortMessage')}
                          onMouseLeave={() => setActiveHighlightField(null)}
                          className="pt-1 border-t border-[#232d3d] hover:bg-[#1f2937] p-1 rounded cursor-pointer"
                        >
                          <div className="text-[#869397] flex justify-between">
                            <span>short_message ({selectedPdu.smLength} bytes):</span>
                            <span className="text-[#4edea3]">GSM-7 Decoded</span>
                          </div>
                          <div className="text-[#dfe2ee] font-body-md font-semibold text-[11px] mt-0.5 break-words">
                            &quot;{selectedPdu.shortMessage}&quot;
                          </div>
                        </div>
                      )}
                      {selectedPdu.messageId && (
                        <div className="flex justify-between px-1 pt-1 border-t border-[#232d3d]">
                          <span className="text-[#869397]">smsc_message_id:</span>
                          <span className="text-[#4cd7f6] font-bold">{selectedPdu.messageId}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Optional TLV Tags */}
                  {selectedPdu.tlvs && selectedPdu.tlvs.length > 0 && (
                    <div className="p-2 rounded bg-[#0a0e16] border border-[#232d3d] space-y-1">
                      <span className="text-[10px] uppercase text-[#d0bcff] font-bold block border-b border-[#232d3d] pb-0.5">
                        3. Optional TLV Parameters ({selectedPdu.tlvs.length})
                      </span>
                      {selectedPdu.tlvs.map((tlv, idx) => (
                        <div key={idx} className="flex justify-between text-[10px] px-1 hover:bg-[#1f2937] rounded">
                          <span className="text-[#869397]">{tlv.tagName} ({tlv.tagHex}):</span>
                          <span className="text-[#d0bcff] font-semibold">{tlv.valueDecoded}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Raw Hex & ASCII Dump View (Right Side) */}
                <div className="p-2.5 rounded bg-[#0a0e16] border border-[#232d3d] flex flex-col font-code-metric text-[10.5px]">
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#232d3d] text-[10px]">
                    <span className="text-[#4cd7f6] font-bold">OCTET STREAM (OFFSET | HEX | ASCII)</span>
                    <span className="text-[#869397]">
                      {activeHighlightField ? `Highlighted: ${activeHighlightField}` : 'Hover field to highlight'}
                    </span>
                  </div>

                  <div className="overflow-x-auto space-y-0.5 leading-relaxed text-[#dfe2ee] select-text">
                    {formattedHexLines.map((line, idx) => (
                      <div key={idx} className="flex items-center gap-2 hover:bg-[#1f2937]/50 px-1 rounded">
                        <span className="text-[#869397] select-none">{line.offsetHex}</span>
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          {line.hexBytes.map((b, byteIdx) => {
                            const globalByteOffset = idx * 16 + byteIdx;
                            let isHighlighted = false;
                            if (activeHighlightField === 'commandLength' && globalByteOffset < 4) isHighlighted = true;
                            if (activeHighlightField === 'commandId' && globalByteOffset >= 4 && globalByteOffset < 8) isHighlighted = true;
                            if (activeHighlightField === 'commandStatus' && globalByteOffset >= 8 && globalByteOffset < 12) isHighlighted = true;
                            if (activeHighlightField === 'sequenceNumber' && globalByteOffset >= 12 && globalByteOffset < 16) isHighlighted = true;
                            if (activeHighlightField === 'shortMessage' && globalByteOffset >= 30) isHighlighted = true;

                            return (
                              <span
                                key={byteIdx}
                                className={`px-0.5 rounded transition-colors ${
                                  isHighlighted
                                    ? 'bg-[#4cd7f6] text-[#00424f] font-bold'
                                    : byteIdx % 2 === 0
                                    ? 'text-[#dfe2ee]'
                                    : 'text-[#bcc9cd]'
                                }`}
                              >
                                {b}
                              </span>
                            );
                          })}
                        </div>
                        <span className="text-[#869397] mx-1">|</span>
                        <span className="text-[#4edea3] tracking-wider select-text">{line.ascii}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#869397]">
              <span className="material-symbols-outlined text-[40px] mb-2 text-[#4cd7f6]">
                troubleshoot
              </span>
              <p>Select a PDU from the live capture buffer on the left to dissect headers and parameters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Craft / Inject Test PDU Modal */}
      {isCraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-lg bg-[#181c24] border border-[#3d494c] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#3d494c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#06b6d4]">send_and_archive</span>
                <h3 className="text-[16px] font-semibold text-[#dfe2ee]">
                  Craft &amp; Inject Test SMPP PDU
                </h3>
              </div>
              <button
                onClick={() => setIsCraftModalOpen(false)}
                className="text-[#bcc9cd] hover:text-[#dfe2ee]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-code-metric text-[12px]">
              <div>
                <label className="text-[10px] text-[#869397] uppercase block mb-1">
                  Target Trunk:
                </label>
                <div className="text-[#4cd7f6] font-bold p-2 rounded bg-[#0a0e16] border border-[#3d494c]">
                  {selectedTrunkId === 'ALL' ? 'Twilio Direct US (trunk-01)' : selectedTrunkId}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#869397] uppercase block mb-1">
                  PDU Command Type:
                </label>
                <select
                  value={craftType}
                  onChange={(e) => setCraftType(e.target.value as any)}
                  className="w-full bg-[#0a0e16] border border-[#3d494c] rounded p-2 text-[#dfe2ee] outline-none"
                >
                  <option value="SUBMIT_SM">submit_sm (0x00000004) - Outbound MT Message</option>
                  <option value="SUBMIT_SM_RESP_THROTTLED">submit_sm_resp (0x80000004) - Throttled 0x58</option>
                  <option value="ENQUIRE_LINK">enquire_link (0x00000015) - Heartbeat Ping</option>
                  <option value="DELIVER_SM_DLR">deliver_sm (0x00000005) - Delivery Receipt (DLR)</option>
                </select>
              </div>

              {craftType.includes('SM') && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#869397] uppercase block mb-1">
                        Source Addr (Alpha/Shortcode):
                      </label>
                      <input
                        type="text"
                        value={craftSource}
                        onChange={(e) => setCraftSource(e.target.value)}
                        className="w-full bg-[#0a0e16] border border-[#3d494c] rounded p-2 text-[#dfe2ee] outline-none"
                        placeholder="VERIFY"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#869397] uppercase block mb-1">
                        Dest MSISDN (E.164):
                      </label>
                      <input
                        type="text"
                        value={craftDest}
                        onChange={(e) => setCraftDest(e.target.value)}
                        className="w-full bg-[#0a0e16] border border-[#3d494c] rounded p-2 text-[#dfe2ee] outline-none"
                        placeholder="+14155550188"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#869397] uppercase block mb-1">
                      Payload Short Message:
                    </label>
                    <textarea
                      rows={2}
                      value={craftMsg}
                      onChange={(e) => setCraftMsg(e.target.value)}
                      className="w-full bg-[#0a0e16] border border-[#3d494c] rounded p-2 text-[#dfe2ee] outline-none"
                      placeholder="Enter SMS payload text..."
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3d494c]">
              <button
                onClick={() => setIsCraftModalOpen(false)}
                className="px-3 py-1.5 rounded bg-[#262a33] text-[#bcc9cd] hover:text-[#dfe2ee] text-[12px]"
              >
                Cancel
              </button>
              <button
                onClick={handleInjectCraftedPdu}
                className="px-4 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[12px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all"
              >
                Inject into Live Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forensic Session Logs Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-lg bg-[#181c24] border border-[#3d494c] p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#3d494c]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-[#06b6d4]/10 border border-[#06b6d4]/30 text-[#4cd7f6]">
                  <span className="material-symbols-outlined text-[22px]">file_download</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#dfe2ee] flex items-center gap-2">
                    Export Session Logs for Offline Forensic Analysis
                  </h3>
                  <p className="text-[11px] text-[#bcc9cd] mt-0.5">
                    Generate authenticated SMPP v3.4 signaling logs for offline post-incident review, SIEM ingestion, or carrier SLA disputes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-[#869397] hover:text-[#dfe2ee] text-[18px] p-1 rounded hover:bg-[#262a33]"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Format Selection */}
            <div>
              <label className="text-[11px] font-code-metric font-semibold text-[#869397] uppercase block mb-2">
                1. Select Export Format:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* CSV Option Card */}
                <div
                  onClick={() => setExportFormat('CSV')}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    exportFormat === 'CSV'
                      ? 'bg-[#10b981]/10 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-[#0a0e16] border-[#3d494c] hover:border-[#869397]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#10b981] text-[18px]">table_view</span>
                      <span className="font-code-metric font-bold text-[13px] text-[#dfe2ee]">
                        CSV Spreadsheet
                      </span>
                    </div>
                    <span
                      className={`h-3 w-3 rounded-full border flex items-center justify-center ${
                        exportFormat === 'CSV' ? 'border-[#10b981] bg-[#10b981]' : 'border-[#869397]'
                      }`}
                    >
                      {exportFormat === 'CSV' && <span className="h-1.5 w-1.5 rounded-full bg-black"></span>}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-[#bcc9cd] leading-relaxed">
                    RFC 4180 flat tabular structure with headers, addresses, status codes, and octet counts. Compatible with Microsoft Excel, Splunk forwarders, and Pandas.
                  </p>
                </div>

                {/* JSON Option Card */}
                <div
                  onClick={() => setExportFormat('JSON')}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    exportFormat === 'JSON'
                      ? 'bg-[#06b6d4]/10 border-[#4cd7f6] shadow-[0_0_12px_rgba(76,215,246,0.2)]'
                      : 'bg-[#0a0e16] border-[#3d494c] hover:border-[#869397]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">data_object</span>
                      <span className="font-code-metric font-bold text-[13px] text-[#dfe2ee]">
                        Forensic JSON
                      </span>
                    </div>
                    <span
                      className={`h-3 w-3 rounded-full border flex items-center justify-center ${
                        exportFormat === 'JSON' ? 'border-[#4cd7f6] bg-[#4cd7f6]' : 'border-[#869397]'
                      }`}
                    >
                      {exportFormat === 'JSON' && <span className="h-1.5 w-1.5 rounded-full bg-black"></span>}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-[#bcc9cd] leading-relaxed">
                    Full hierarchical packet archive including carrier session metadata, throughput timing, nested Optional TLVs, and compliance cryptographic verification hash.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Log Scope Selection */}
            <div>
              <label className="text-[11px] font-code-metric font-semibold text-[#869397] uppercase block mb-2">
                2. Data Capture Scope:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setExportScope('FILTERED')}
                  className={`p-2.5 rounded border cursor-pointer text-[11px] font-code-metric transition-all ${
                    exportScope === 'FILTERED'
                      ? 'bg-[#1e2430] border-[#4cd7f6] text-[#dfe2ee]'
                      : 'bg-[#0a0e16] border-[#3d494c] text-[#bcc9cd] hover:border-[#869397]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>Filtered View ({filteredPdus.length} PDUs)</span>
                    <span className="text-[#4cd7f6]">Active Criteria</span>
                  </div>
                  <div className="text-[10px] text-[#869397] mt-1 space-y-0.5">
                    <div>Trunk: <span className="text-[#dfe2ee]">{selectedTrunkId}</span></div>
                    <div>Flow: <span className="text-[#dfe2ee]">{directionFilter}</span> • Cmd: <span className="text-[#dfe2ee]">{commandFilter}</span></div>
                  </div>
                </div>

                <div
                  onClick={() => setExportScope('ALL')}
                  className={`p-2.5 rounded border cursor-pointer text-[11px] font-code-metric transition-all ${
                    exportScope === 'ALL'
                      ? 'bg-[#1e2430] border-[#4cd7f6] text-[#dfe2ee]'
                      : 'bg-[#0a0e16] border-[#3d494c] text-[#bcc9cd] hover:border-[#869397]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>Complete Ring Buffer ({pdus.length} PDUs)</span>
                    <span className="text-[#4edea3]">Full Cache</span>
                  </div>
                  <div className="text-[10px] text-[#869397] mt-1 space-y-0.5">
                    <div>Unfiltered ring buffer in memory</div>
                    <div>Includes all trunks, keepalives &amp; DLRs</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Forensic Field Options */}
            <div>
              <label className="text-[11px] font-code-metric font-semibold text-[#869397] uppercase block mb-1.5">
                3. Forensic Data Fields &amp; Compliance Options:
              </label>
              <div className="p-3 rounded bg-[#0a0e16] border border-[#293240] space-y-2 text-[11px] font-code-metric">
                <label className="flex items-center gap-2 cursor-pointer text-[#dfe2ee] hover:text-[#4cd7f6]">
                  <input
                    type="checkbox"
                    checked={includeRawHexInExport}
                    onChange={(e) => setIncludeRawHexInExport(e.target.checked)}
                    className="rounded bg-[#181c24] border-[#3d494c] text-[#06b6d4] focus:ring-0"
                  />
                  <span>Include Raw Octet Hex Dump (<code className="text-[#4edea3]">rawHex</code> octet streams)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[#dfe2ee] hover:text-[#4cd7f6]">
                  <input
                    type="checkbox"
                    checked={includeTlvsInExport}
                    onChange={(e) => setIncludeTlvsInExport(e.target.checked)}
                    className="rounded bg-[#181c24] border-[#3d494c] text-[#06b6d4] focus:ring-0"
                  />
                  <span>Include Decoded Optional TLVs (<code className="text-[#d0bcff]">sar_msg_ref_num, message_state</code>)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[#dfe2ee] hover:text-[#4cd7f6]">
                  <input
                    type="checkbox"
                    checked={includeAuditEnvelope}
                    onChange={(e) => setIncludeAuditEnvelope(e.target.checked)}
                    className="rounded bg-[#181c24] border-[#3d494c] text-[#06b6d4] focus:ring-0"
                  />
                  <span>Attach SIEM Compliance Header (Operator Callsign, Timestamp &amp; SHA-256 Session Hash)</span>
                </label>
              </div>
            </div>

            {/* Forensic Preview Box */}
            {(() => {
              const activeSet = exportScope === 'FILTERED' ? filteredPdus : pdus;
              const rxCount = activeSet.filter((p) => p.direction === 'INCOMING').length;
              const txCount = activeSet.filter((p) => p.direction === 'OUTGOING').length;
              const errCount = activeSet.filter((p) => p.commandStatusHex !== '0x00000000').length;
              const avgLat =
                activeSet.length > 0
                  ? (activeSet.reduce((acc, p) => acc + p.latencyMs, 0) / activeSet.length).toFixed(1)
                  : '0';
              const estKb = Math.round(
                activeSet.length *
                  (exportFormat === 'CSV'
                    ? includeRawHexInExport
                      ? 0.38
                      : 0.22
                    : includeRawHexInExport
                    ? 0.92
                    : 0.55)
              );

              return (
                <div className="p-3 rounded bg-[#10141d] border border-[#232d3d] text-[10.5px] font-code-metric space-y-1.5">
                  <div className="flex items-center justify-between text-[#869397] pb-1 border-b border-[#232d3d]">
                    <span className="font-bold text-[#4cd7f6]">FORENSIC EXPORT MANIFEST PREVIEW</span>
                    <span className="text-[#4edea3]">READY FOR EXTRACTION</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#dfe2ee] pt-1">
                    <div>
                      <span className="text-[#869397] block text-[9.5px]">RECORDS:</span>
                      <strong className="text-[12px]">{activeSet.length} PDUs</strong>
                    </div>
                    <div>
                      <span className="text-[#869397] block text-[9.5px]">FLOW BREAKDOWN:</span>
                      <span>{rxCount} RX / {txCount} TX</span>
                    </div>
                    <div>
                      <span className="text-[#869397] block text-[9.5px]">THROTTLES / ERRORS:</span>
                      <span className={errCount > 0 ? 'text-[#ef4444] font-bold' : 'text-[#4edea3]'}>
                        {errCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#869397] block text-[9.5px]">EST. FILE SIZE:</span>
                      <span>~{estKb} KB</span>
                    </div>
                  </div>
                  <div className="text-[9.5px] text-[#869397] pt-1 border-t border-[#232d3d] flex items-center justify-between truncate">
                    <span>Target: smpp-session-forensics-{exportScope.toLowerCase()}-{Date.now().toString().slice(0, 8)}.{exportFormat.toLowerCase()}</span>
                    <span>Avg Latency: {avgLat}ms</span>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#3d494c]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#869397] uppercase font-code-metric">Quick 1-Click:</span>
                <button
                  onClick={() => handleExportSessionCsv(exportScope)}
                  className="px-2 py-1 rounded bg-[#0a0e16] border border-[#3d494c] text-[10.5px] font-code-metric text-[#10b981] hover:bg-[#262a33] hover:border-[#10b981]"
                >
                  Direct CSV
                </button>
                <button
                  onClick={() => handleExportSessionJson(exportScope)}
                  className="px-2 py-1 rounded bg-[#0a0e16] border border-[#3d494c] text-[10.5px] font-code-metric text-[#06b6d4] hover:bg-[#262a33] hover:border-[#06b6d4]"
                >
                  Direct JSON
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-[#262a33] text-[#bcc9cd] hover:text-[#dfe2ee] text-[12px]"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    exportFormat === 'CSV'
                      ? handleExportSessionCsv(exportScope)
                      : handleExportSessionJson(exportScope)
                  }
                  className="flex items-center gap-2 px-4 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[12px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>
                    Download {exportFormat} File (
                    {exportScope === 'FILTERED' ? filteredPdus.length : pdus.length} Records)
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
