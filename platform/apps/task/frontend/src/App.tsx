import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Layers,
  Workflow,
  Zap,
  Users,
  CreditCard,
  PieChart,
  Banknote,
  FileSpreadsheet,
  Settings,
  Send,
  Play,
  LayoutGrid,
  RotateCw,
  CheckCircle2,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Wand2,
  Search,
  X,
  ShieldCheck,
  Info,
  Plus,
  Trash2,
  History,
  Clock,
  FileJson,
  CheckCheck,
  Eye,
  Terminal,
  AlertCircle,
  Edit3,
  KeyRound,
} from 'lucide-react';
import axios from 'axios';

interface MerchantConfig {
  id?: number;
  configName: string;
  sysId: string;
  productId: string;
  rsaHuifuPublicKey?: string;
  rsaMerchPrivateKey?: string;
  rsaPublicKey?: string;
  rsaPrivateKey?: string;
  isProd: boolean;
  isDefault?: boolean;
}

interface FieldOption {
  value: string;
  label: string;
}

interface FormFieldDef {
  key: string;
  label: string;
  required: boolean | 'C';
  requiredType: 'Y' | 'N' | 'C';
  type?: 'text' | 'select' | 'textarea' | 'object' | 'array';
  options?: FieldOption[];
  defaultValue?: any;
  hint?: string;
  placeholder?: string;
  subFields?: FormFieldDef[];
}

interface ApiMenuItem {
  id: string;
  category: string;
  categoryLabel: string;
  label: string;
  api: string;
  ep: string;
  method: 'POST' | 'GET';
  desc?: string;
  fields: FormFieldDef[];
}

interface CategoryGroup {
  key: string;
  title: string;
  icon: React.ElementType;
  items: ApiMenuItem[];
}

export const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return window.innerWidth < 900 || localStorage.getItem('task_sidebar_collapsed') === 'true';
  });

  const [searchQuery, setSearchQuery] = useState('');

  const [activeCategory, setActiveCategory] = useState<string>(() => {
    return localStorage.getItem('task_active_category') || 'merchant_onboarding';
  });
  const [activeMenu, setActiveMenu] = useState<string>(() => {
    return localStorage.getItem('task_active_menu') || 'merch_ent_open';
  });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const savedCat = localStorage.getItem('task_active_category') || 'merchant_onboarding';
    return {
      merchant_onboarding: savedCat === 'merchant_onboarding',
      user_onboarding: savedCat === 'user_onboarding',
      payment_product: savedCat === 'payment_product',
      split_service: savedCat === 'split_service',
      payout_service: savedCat === 'payout_service',
    };
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper to switch and persist active menu
  const selectMenu = (category: string, menuId: string) => {
    setActiveCategory(category);
    setActiveMenu(menuId);
    localStorage.setItem('task_active_category', category);
    localStorage.setItem('task_active_menu', menuId);
    setOpenSections((prev) => ({ ...prev, [category]: true }));
  };

  const [configList, setConfigList] = useState<MerchantConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<MerchantConfig | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<number | null>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState('');
  const [configForm, setConfigForm] = useState<{
    configName: string;
    sysId: string;
    productId: string;
    isProd: boolean;
    isDefault: boolean;
    rsaHuifuPublicKey: string;
    rsaMerchPrivateKey: string;
  }>({
    configName: '汇付斗拱-正式生产商户',
    sysId: '6666000109133323',
    productId: 'YYZY',
    isProd: true,
    isDefault: true,
    rsaHuifuPublicKey: '',
    rsaMerchPrivateKey: '',
  });

  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedRes, setCopiedRes] = useState(false);

  // Form values supporting primitives, nested objects, and arrays of objects
  const [formData, setFormData] = useState<Record<string, any>>({});
  // Execution & History Modals State
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [lastExecution, setLastExecution] = useState<{
    id: number;
    apiName: string;
    apiPath: string;
    method: string;
    reqSeqId: string;
    huifuId: string;
    requestPayload: any;
    responseData: any;
    isSuccess: boolean;
    respCode: string;
    respDesc: string;
    durationMs: number;
    timestamp: string;
  } | null>(null);

  const [historyList, setHistoryList] = useState<Array<{
    id: number;
    apiName: string;
    apiPath: string;
    method: string;
    reqSeqId: string;
    huifuId: string;
    requestPayload: any;
    responseData: any;
    isSuccess: boolean;
    respCode: string;
    respDesc: string;
    durationMs: number;
    timestamp: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('task_exec_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [resultTab, setResultTab] = useState<'response' | 'request' | 'both'>('both');
  const [copiedReqJson, setCopiedReqJson] = useState(false);
  const [copiedRespJson, setCopiedRespJson] = useState(false);


  // Auto sync activeCategory to localStorage and keep its accordion section open
  useEffect(() => {
    if (activeCategory) {
      localStorage.setItem('task_active_category', activeCategory);
      setOpenSections((prev) => ({ ...prev, [activeCategory]: true }));
    }
  }, [activeCategory]);

  // Auto sync activeMenu to localStorage
  useEffect(() => {
    if (activeMenu) {
      localStorage.setItem('task_active_menu', activeMenu);
    }
  }, [activeMenu]);


  // ================= 1. 商户进件 (16 接口，按官方文档 1:1 顺序排列) =================
  const merchantOnboardingMenus: ApiMenuItem[] = [
    {
      id: 'merch_ent_open',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '企业商户进件',
      api: 'v2/merchant/basicdata/ent',
      ep: '/api/huifu/merchant/enterprise/open',
      method: 'POST',
      desc: '通过此接口在汇付为企业类商户进行基本信息开户。传入企业商户基本资料和图片资料，开通汇付账号，为商户绑定银行卡、配置结算和取现等功能。',
      fields: [
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '请求流水号，当日唯一', placeholder: '2026082914120615001' },
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '日期格式：yyyyMMdd', placeholder: '20260829' },
        { key: 'upper_huifu_id', label: '直属渠道号 (upper_huifu_id)', required: false, requiredType: 'C', defaultValue: '', hint: '该商户进件完成后归属的渠道商huifu_id', placeholder: '6666000123123123' },
        { key: 'reg_name', label: '商户名 (reg_name)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户名称，必须与企业营业执照一致', placeholder: '上海创景数智信息技术有限公司' },
        { key: 'short_name', label: '商户简称 (short_name)', required: true, requiredType: 'Y', defaultValue: '', hint: '最少4个字符；会展示在消费账单上', placeholder: '创景数智' },
        { key: 'receipt_name', label: '小票名称 (receipt_name)', required: true, requiredType: 'Y', defaultValue: '', hint: '小票名称展示在POS小票上', placeholder: '创景数智便利店' },
        { key: 'mer_en_name', label: '商户英文名称 (mer_en_name)', required: false, requiredType: 'N', defaultValue: '', hint: '选填，示例值：huifupay', placeholder: 'huifupay' },
        { key: 'ent_type', label: '公司类型 (ent_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '1', label: '1 - 政府机构' }, { value: '2', label: '2 - 国营企业' }, { value: '3', label: '3 - 私营企业' }, { value: '4', label: '4 - 外资企业' }, { value: '5', label: '5 - 个体工商户' }, { value: '6', label: '6 - 其它组织' }, { value: '7', label: '7 - 事业单位' }, { value: '9', label: '9 - 业主委员会' }], hint: '公司类型分类' },
        { key: 'mcc', label: '所属行业 (mcc)', required: false, requiredType: 'C', defaultValue: '', hint: '参考汇付MCC编码，如 5411-超市零售，5812-餐饮', placeholder: '5411' },
        { key: 'busi_type', label: '经营类型 (busi_type)', required: false, requiredType: 'C', type: 'select', defaultValue: '', options: [{ value: '1', label: '1 - 实体' }, { value: '2', label: '2 - 虚拟' }], hint: '1:实体，2:虚拟' },
        { key: 'scene_type', label: '场景类型 (scene_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: 'ALL', label: 'ALL - 线上线下' }, { value: 'ONLINE', label: 'ONLINE - 线上场景' }, { value: 'OFFLINE', label: 'OFFLINE - 线下场景' }], hint: '交易业务场景类型' },
        { key: 'license_pic', label: '营业执照图片 (license_pic)', required: true, requiredType: 'Y', defaultValue: '', hint: '通过图片上传接口上传获得的文件File ID (文件类型: F07)', placeholder: '57cc7f00-600a-33ab-b614-6221bbf2e530' },
        { key: 'license_code', label: '证照编号 (license_code)', required: true, requiredType: 'Y', defaultValue: '', hint: '工商营业执照统一社会信用代码', placeholder: '91310115MA1K4ABCD1' },
        { key: 'license_type', label: '证照类型 (license_type)', required: false, requiredType: 'N', type: 'select', defaultValue: '', options: [{ value: 'NATIONAL_LEGAL_MERGE', label: 'NATIONAL_LEGAL_MERGE - 多证合一营业执照' }, { value: 'NATIONAL_LEGAL', label: 'NATIONAL_LEGAL - 传统营业执照' }], hint: '默认 NATIONAL_LEGAL_MERGE' },
        { key: 'license_validity_type', label: '证照有效期类型 (license_validity_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '1', label: '1 - 长期有效' }, { value: '0', label: '0 - 非长期有效' }], hint: '营业执照有效期类型' },
        { key: 'license_begin_date', label: '证照有效期开始日期 (license_begin_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd', placeholder: '20200101' },
        { key: 'license_end_date', label: '证照有效期截止日期 (license_end_date)', required: false, requiredType: 'C', defaultValue: '', hint: '格式：yyyyMMdd，license_validity_type=0 时必填', placeholder: '20400101' },
        { key: 'found_date', label: '成立时间 (found_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd', placeholder: '20200101' },
        { key: 'reg_capital', label: '注册资本 (reg_capital)', required: false, requiredType: 'C', defaultValue: '', hint: '保留两位小数，单位万元', placeholder: '100.00' },
        { key: 'business_scope', label: '经营范围 (business_scope)', required: false, requiredType: 'N', defaultValue: '', hint: '经营范围说明，需与营业执照一致', placeholder: '经营范围' },
        { key: 'reg_prov_id', label: '注册省 (reg_prov_id)', required: false, requiredType: 'N', defaultValue: '', hint: '参考地区码，如 310000 上海市', placeholder: '310000' },
        { key: 'reg_area_id', label: '注册市 (reg_area_id)', required: false, requiredType: 'N', defaultValue: '', hint: '参考地区码，如 310100 上海市市辖区', placeholder: '310100' },
        { key: 'reg_district_id', label: '注册区 (reg_district_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '参考地区码，如 310115 浦东新区', placeholder: '310115' },
        { key: 'reg_detail', label: '注册详细地址 (reg_detail)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户注册地址或营业执照住所', placeholder: '详细地址' },
        { key: 'prov_id', label: '经营省 (prov_id)', required: false, requiredType: 'N', defaultValue: '', hint: '实际经营所在省编码', placeholder: '310000' },
        { key: 'area_id', label: '经营市 (area_id)', required: false, requiredType: 'N', defaultValue: '', hint: '实际经营所在市编码', placeholder: '310100' },
        { key: 'district_id', label: '经营区 (district_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '实际经营所在区编码', placeholder: '310115' },
        { key: 'detail_addr', label: '经营详细地址 (detail_addr)', required: false, requiredType: 'C', defaultValue: '', hint: 'scene_type 为 OFFLINE/ALL 时必填', placeholder: '经营详细地址' },
        { key: 'legal_name', label: '法人姓名 (legal_name)', required: true, requiredType: 'Y', defaultValue: '', hint: '法人或负责人姓名，最大支持16个汉字', placeholder: '法人姓名' },
        { key: 'legal_cert_type', label: '法人证件类型 (legal_cert_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '00', label: '00 - 居民身份证' }, { value: '01', label: '01 - 护照' }, { value: '04', label: '04 - 港澳居民来往内地通行证' }, { value: '11', label: '11 - 台湾居民来往大陆通行证' }, { value: '13', label: '13 - 外国人居留证' }, { value: '15', label: '15 - 港澳台居住证' }, { value: '20', label: '20 - 其它证件' }], hint: '法人有效证件类型' },
        { key: 'legal_cert_no', label: '法人证件号码 (legal_cert_no)', required: true, requiredType: 'Y', defaultValue: '', hint: '18位身份证号码，年龄需在18-80岁之间', placeholder: '310115199001011234' },
        { key: 'legal_cert_validity_type', label: '法人证件有效期类型 (legal_cert_validity_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '1', label: '1 - 长期有效' }, { value: '0', label: '0 - 非长期有效' }], hint: '证件有效期类型' },
        { key: 'legal_cert_begin_date', label: '法人证件开始日期 (legal_cert_begin_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd', placeholder: '20200101' },
        { key: 'legal_cert_end_date', label: '法人证件截止日期 (legal_cert_end_date)', required: false, requiredType: 'C', defaultValue: '', hint: '格式：yyyyMMdd，非长期有效时必填', placeholder: '20400101' },
        { key: 'legal_mobile_no', label: '法人手机号 (legal_mobile_no)', required: false, requiredType: 'N', defaultValue: '', hint: '法人手机号，全域资金业务必填', placeholder: '13911111111' },
        { key: 'legal_addr', label: '法人证件地址 (legal_addr)', required: true, requiredType: 'Y', defaultValue: '', hint: '法人身份证住址', placeholder: '法人身份证住址' },
        { key: 'legal_cert_back_pic', label: '法人身份证国徽面 (legal_cert_back_pic)', required: true, requiredType: 'Y', defaultValue: '', hint: '通过图片上传接口上传 (文件类型: F03)', placeholder: 'File ID' },
        { key: 'legal_cert_front_pic', label: '法人身份证人像面 (legal_cert_front_pic)', required: true, requiredType: 'Y', defaultValue: '', hint: '通过图片上传接口上传 (文件类型: F02)', placeholder: 'File ID' },
        {
          key: 'beneficiary_info',
          label: '受益人列表 (beneficiary_info)',
          required: false,
          requiredType: 'N',
          type: 'array',
          defaultValue: [
            {
              bo_name: '张三',
              bo_type: '00',
              bo_no: '310115199001011234',
              bo_date_start: '20200101',
              bo_dead_line: '29991231',
              bo_address: '上海市徐汇区宜山路700号',
              bo_mobile_no: '13911111111',
              final_beneficiary_mode: 'A01',
            },
          ],
          hint: '包含多个受益人对象，支持点击新增或删除多条受益人',
          subFields: [
            { key: 'bo_name', label: '受益人名称', required: true, requiredType: 'Y', placeholder: '张三' },
            { key: 'bo_type', label: '受益人证件类型', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '00', label: '00 - 身份证' }, { value: '01', label: '01 - 护照' }, { value: '12', label: '12 - 营业执照' }] },
            { key: 'bo_no', label: '受益人证件号', required: true, requiredType: 'Y', placeholder: '310115...' },
            { key: 'bo_date_start', label: '有效期开始时间', required: true, requiredType: 'Y', placeholder: '20200101' },
            { key: 'bo_dead_line', label: '有效期结束时间', required: true, requiredType: 'Y', placeholder: '29991231' },
            { key: 'bo_address', label: '受益人证件地址', required: true, requiredType: 'Y', placeholder: '详细地址' },
            { key: 'bo_mobile_no', label: '受益人手机号', required: false, requiredType: 'C', placeholder: '13911111111' },
            { key: 'final_beneficiary_mode', label: '最终受益人方式', required: false, requiredType: 'C', type: 'select', defaultValue: '', options: [{ value: 'A01', label: 'A01 - 直接或间接控股25%以上' }, { value: 'A02', label: 'A02 - 人事财务控制' }, { value: 'A03', label: 'A03 - 高级管理人员' }, { value: 'A04', label: 'A04 - 法人或负责人' }, { value: 'A05', label: 'A05 - 其他' }] },
          ],
        },
        { key: 'contact_name', label: '管理员姓名 (contact_name)', required: false, requiredType: 'N', defaultValue: '', hint: '默认法人姓名', placeholder: '管理员姓名' },
        { key: 'contact_mobile_no', label: '管理员手机号 (contact_mobile_no)', required: true, requiredType: 'Y', defaultValue: '', hint: '11位手机号，用于接收签约及验证短信', placeholder: '18611111111' },
        { key: 'contact_email', label: '管理员电子邮箱 (contact_email)', required: true, requiredType: 'Y', defaultValue: '', hint: '电子合同与回单接收邮箱', placeholder: 'email@domain.com' },
        { key: 'sms_send_flag', label: '商户通知标识 (sms_send_flag)', required: false, requiredType: 'N', type: 'select', defaultValue: '', options: [{ value: 'M', label: 'M - 发送短信通知' }, { value: 'E', label: 'E - 发送邮件通知' }, { value: 'A', label: 'A - 短信、邮件都通知' }, { value: '', label: '为空 - 不作通知' }], hint: '进件成功通知方式' },
        { key: 'login_name', label: '管理员账号 (login_name)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-6), hint: '用于商户平台登录，全局唯一，支持英文/数字/下划线', placeholder: 'huifu001' },
        { key: 'service_phone', label: '客服电话 (service_phone)', required: false, requiredType: 'N', defaultValue: '', hint: '消费者客服热线电话', placeholder: '021-88888888' },
        { key: 'reg_acct_pic', label: '开户许可证 (reg_acct_pic)', required: false, requiredType: 'C', defaultValue: '', hint: '结算账号为对公账户必填 (文件类型: F08)', placeholder: 'File ID' },
        {
          key: 'card_info',
          label: '银行卡信息配置 (card_info)',
          required: true,
          requiredType: 'Y',
          type: 'object',
          hint: '商户银行账户信息配置扩展表单',
          defaultValue: {
            card_type: '0',
            card_name: '上海创景数智信息技术有限公司',
            card_no: '6222021001123456789',
            branch_code: '102100099996',
            prov_id: '310000',
            area_id: '310100',
            cert_type: '00',
            cert_no: '',
            cert_validity_type: '1',
            cert_begin_date: '20200101',
            cert_end_date: '',
            mp: '',
            is_settle_default: 'Y',
          },
          subFields: [
            { key: 'card_type', label: '银行账户类型', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '0', label: '0 - 对公账户' }, { value: '1', label: '1 - 对私法人账户' }, { value: '2', label: '2 - 对私非法人账户' }] },
            { key: 'card_name', label: '银行账户名', required: true, requiredType: 'Y', placeholder: '开户名' },
            { key: 'card_no', label: '银行账号', required: true, requiredType: 'Y', placeholder: '卡号/账号' },
            { key: 'branch_code', label: '开户行联行号', required: false, requiredType: 'C', placeholder: '12位联行号 (对公必填)' },
            { key: 'prov_id', label: '银行所在省编码', required: false, requiredType: 'N', placeholder: '310000' },
            { key: 'area_id', label: '银行所在市编码', required: true, requiredType: 'Y', placeholder: '310100' },
            { key: 'cert_type', label: '持卡人证件类型', required: false, requiredType: 'C', type: 'select', defaultValue: '', options: [{ value: '00', label: '00 - 身份证' }, { value: '01', label: '01 - 护照' }] },
            { key: 'cert_no', label: '持卡人证件号码', required: false, requiredType: 'C', placeholder: '对私必填' },
            { key: 'is_settle_default', label: '默认结算卡标志', required: false, requiredType: 'N', type: 'select', defaultValue: '', options: [{ value: 'Y', label: 'Y - 是' }, { value: 'N', label: 'N - 否' }] },
          ],
        },
        {
          key: 'settle_config',
          label: '结算业务配置 (settle_config)',
          required: false,
          requiredType: 'N',
          type: 'object',
          hint: '商户结算规则配置扩展表单',
          defaultValue: {
            settle_cycle: 'T1',
            min_amt: '1.00',
            remained_amt: '0.00',
            settle_abstract: '结算打款',
            out_settle_flag: '2',
            settle_pattern: 'P0',
          },
          subFields: [
            { key: 'settle_cycle', label: '结算周期', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: 'T1', label: 'T1 - 工作日次日结算' }, { value: 'D1', label: 'D1 - 自然日次日结算' }, { value: 'TS', label: 'TS - 笔笔结算' }] },
            { key: 'min_amt', label: '起结金额 (元)', required: false, requiredType: 'N', placeholder: '1.00' },
            { key: 'remained_amt', label: '留存金额 (元)', required: false, requiredType: 'N', placeholder: '0.00' },
            { key: 'settle_abstract', label: '结算摘要', required: false, requiredType: 'N', placeholder: '结算备注' },
            { key: 'out_settle_flag', label: '手续费外扣标记', required: false, requiredType: 'N', type: 'select', defaultValue: '', options: [{ value: '2', label: '2 - 内扣 (从结算金额中扣除)' }, { value: '1', label: '1 - 外扣 (从指定账户扣除)' }] },
            { key: 'settle_pattern', label: '结算方式', required: false, requiredType: 'N', type: 'select', defaultValue: '', options: [{ value: 'P0', label: 'P0 - 批次结算' }, { value: 'P2', label: 'P2 - 批次定时结算' }] },
          ],
        },
        { key: 'settle_card_front_pic', label: '银行卡卡号面 (settle_card_front_pic)', required: false, requiredType: 'C', defaultValue: '', hint: '对私必填 (文件类型: F13)', placeholder: 'File ID' },
        { key: 'settle_cert_back_pic', label: '持卡人身份证国徽面 (settle_cert_back_pic)', required: false, requiredType: 'C', defaultValue: '', hint: '对私必填 (文件类型: F56)', placeholder: 'File ID' },
        { key: 'settle_cert_front_pic', label: '持卡人身份证人像面 (settle_cert_front_pic)', required: false, requiredType: 'C', defaultValue: '', hint: '对私必填 (文件类型: F55)', placeholder: 'File ID' },
        { key: 'auth_entrust_pic', label: '授权委托书 (auth_entrust_pic)', required: false, requiredType: 'C', defaultValue: '', hint: '对私非法人/对公非同名结算必填 (文件类型: F15)', placeholder: 'File ID' },
        {
          key: 'cash_config',
          label: '取现业务配置 (cash_config)',
          required: false,
          requiredType: 'N',
          type: 'array',
          hint: '商户取现规则配置列表，包含多个取现对象，可动态新增或删除',
          defaultValue: [
            {
              cash_type: 'D0',
              fix_amt: '1.00',
              fee_rate: '0.00',
              out_fee_flag: '2',
            },
            {
              cash_type: 'T1',
              fix_amt: '0.00',
              fee_rate: '0.05',
              out_fee_flag: '2',
            },
          ],
          subFields: [
            { key: 'cash_type', label: '取现类型', required: false, requiredType: 'N', type: 'select', defaultValue: '', options: [{ value: 'D0', label: 'D0 - 当日到账 (含当天交易)' }, { value: 'T1', label: 'T1 - 下个工作日到账' }, { value: 'D1', label: 'D1 - 下个自然日到账' }, { value: 'DM', label: 'DM - 当日到账 (不含当天交易)' }] },
            { key: 'fix_amt', label: '固定手续费 (元)', required: false, requiredType: 'C', placeholder: '1.00' },
            { key: 'fee_rate', label: '手续费率 (%)', required: false, requiredType: 'C', placeholder: '0.05' },
            { key: 'weekday_fix_amt', label: '工作日固定手续费 (元)', required: false, requiredType: 'C', placeholder: '1.00' },
            { key: 'weekday_fee_rate', label: '工作日手续费率 (%)', required: false, requiredType: 'C', placeholder: '0.05' },
            { key: 'out_fee_flag', label: '是否手续费外扣', required: false, requiredType: 'N', type: 'select', defaultValue: '', options: [{ value: '2', label: '2 - 内扣 (默认)' }, { value: '1', label: '1 - 外扣' }] },
          ],
        },
        { key: 'head_office_flag', label: '商户身份 (head_office_flag)', required: false, requiredType: 'N', type: 'select', defaultValue: '', options: [{ value: '0', label: '0 - 普通/下级商户' }, { value: '1', label: '1 - 总部商户' }], hint: '商户层级身份' },
        { key: 'use_head_info_flag', label: '使用上级资料信息 (use_head_info_flag)', required: false, requiredType: 'N', type: 'select', defaultValue: '', options: [{ value: 'N', label: 'N - 否' }, { value: 'Y', label: 'Y - 是' }], hint: '选Y则基本信息部分复用上级' },
        { key: 'head_huifu_id', label: '上级汇付Id (head_huifu_id)', required: false, requiredType: 'C', defaultValue: '', hint: '条件必填，上级商户汇付号', placeholder: '6666000123123123' },
        { key: 'mer_url', label: '商户主页URL (mer_url)', required: false, requiredType: 'N', defaultValue: '', hint: '商户主页或官网URL', placeholder: 'https://...' },
        { key: 'mer_icp', label: '商户ICP备案编号 (mer_icp)', required: false, requiredType: 'C', defaultValue: '', hint: 'PC网站/分账业务需提供', placeholder: '沪ICP备...' },
        { key: 'store_header_pic', label: '店铺门头照 (store_header_pic)', required: false, requiredType: 'C', defaultValue: '', hint: '线下场景必填 (文件类型: F22)', placeholder: 'File ID' },
        { key: 'store_indoor_pic', label: '店铺内景/工作区域照 (store_indoor_pic)', required: false, requiredType: 'C', defaultValue: '', hint: '线下场景必填 (文件类型: F24)', placeholder: 'File ID' },
        { key: 'store_cashier_desk_pic', label: '店铺收银台/前台照 (store_cashier_desk_pic)', required: false, requiredType: 'C', defaultValue: '', hint: '线下场景必填 (文件类型: F105)', placeholder: 'File ID' },
        { key: 'ext_mer_id', label: '外部商户号 (ext_mer_id)', required: false, requiredType: 'N', defaultValue: '' + Date.now().toString().slice(-6), hint: '外部商户系统自定义编码', placeholder: 'HF100001' },
        { key: 'remarks', label: '备注 (remarks)', required: false, requiredType: 'N', defaultValue: '', hint: '进件备注说明', placeholder: '备注内容' },
        { key: 'async_return_url', label: '异步请求地址 (async_return_url)', required: false, requiredType: 'N', defaultValue: '', hint: '审核结果消息Webhook接收地址', placeholder: 'http://service.example.com/to/path' },
        {
          key: 'elec_acct_config',
          label: '斗拱e账户功能配置 (elec_acct_config)',
          required: false,
          requiredType: 'N',
          type: 'object',
          hint: '下级商户配置银行电子账户',
          defaultValue: { switch_state: '0', acct_type: '01', cash_fee_party: '1', scene: '001', role_type: '001001' },
          subFields: [
            { key: 'switch_state', label: '电子账户开关', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '0', label: '0 - 关闭' }, { value: '1', label: '1 - 开通' }] },
            { key: 'acct_type', label: '账户类型', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '01', label: '01 - 中信e管家' }] },
            { key: 'cash_fee_party', label: '取现手续费承担方', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '1', label: '1 - 总部' }, { value: '2', label: '2 - 其他' }] },
          ],
        },
        {
          key: 'share_holder_info_list',
          label: '股东信息 (share_holder_info_list)',
          required: false,
          requiredType: 'N',
          type: 'array',
          hint: '全域资金业务股东名单，可动态新增多项',
          defaultValue: [],
          subFields: [
            { key: 'name', label: '股东姓名', required: true, requiredType: 'Y', placeholder: '张三' },
            { key: 'cert_type', label: '股东证件类型', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '00', label: '00 - 身份证' }, { value: '12', label: '12 - 营业执照' }] },
            { key: 'cert_no', label: '股东证件号码', required: true, requiredType: 'Y', placeholder: '320926...' },
            { key: 'cert_validity_type', label: '有效期类型', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '1', label: '1 - 长期' }, { value: '0', label: '0 - 非长期' }] },
            { key: 'cert_begin_date', label: '有效期起始日', required: true, requiredType: 'Y', placeholder: '20201223' },
            { key: 'cert_end_date', label: '有效期到期日', required: false, requiredType: 'N', placeholder: '20301223' },
          ],
        },
        {
          key: 'extended_material_list',
          label: '扩展资料包 (extended_material_list)',
          required: false,
          requiredType: 'N',
          type: 'array',
          hint: '补充材料列表，可动态新增多条文件',
          defaultValue: [],
          subFields: [
            { key: 'file_id', label: '材料文件ID (file_id)', required: true, requiredType: 'Y', placeholder: '57cc7f00...' },
            { key: 'file_type', label: '文件类型代码 (file_type)', required: true, requiredType: 'Y', placeholder: 'F01 / F15 / F511' },
          ],
        },
        { key: 'activated_products', label: '产品大类 (activated_products)', required: false, requiredType: 'N', defaultValue: '', hint: '01:一体化收款, 02:账户与资金, 03:业财数通', placeholder: '01,02,03' },
        {
          key: 'material_card_info',
          label: '对公卡信息 (material_card_info)',
          required: false,
          requiredType: 'N',
          type: 'object',
          hint: '对私结算时需补充对公同名账户',
          defaultValue: { card_name: '', card_no: '', branch_code: '' },
          subFields: [
            { key: 'card_name', label: '对公账户名', required: false, requiredType: 'N', placeholder: '企业全称' },
            { key: 'card_no', label: '对公银行账号', required: true, requiredType: 'Y', placeholder: '对公卡号' },
            { key: 'branch_code', label: '支行联行号', required: true, requiredType: 'Y', placeholder: '12位联行号' },
          ],
        },
        { key: 'head_type', label: '总部客群 (head_type)', required: false, requiredType: 'N', type: 'select', defaultValue: '', options: [{ value: '', label: '不设置' }, { value: '0', label: '0 - 集团客户' }, { value: '1', label: '1 - 大型商业综合体' }, { value: '2', label: '2 - 品牌连锁客户' }], hint: '当 head_office_flag 为 1 时必填' },
      ],
    },
    {
      id: 'merch_indv_open',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '个人商户进件',
      api: 'v2/merchant/basicdata/indv',
      ep: '/api/huifu/merchant/personal/open',
      method: 'POST',
      desc: '通过此接口在汇付为个人/小微商户进行基本信息开户。传入个人商户基本资料和图片资料，开通汇付账号。',
      fields: [
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '请求流水号，同一商户号当天唯一', placeholder: '2026082914120615001' },
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '日期格式：yyyyMMdd', placeholder: '20260829' },
        { key: 'upper_huifu_id', label: '直属渠道号 (upper_huifu_id)', required: false, requiredType: 'C', defaultValue: '', hint: '该商户进件完成后归属的渠道商huifu_id', placeholder: '6666000123123123' },
        { key: 'reg_name', label: '商户名 (reg_name)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户名称，个人类商户为负责人姓名', placeholder: '张三' },
        { key: 'short_name', label: '商户简称 (short_name)', required: false, requiredType: 'N', defaultValue: '', hint: '最少4个字符；会展示在消费账单上', placeholder: '张三小铺' },
        { key: 'mcc', label: '所属行业 (mcc)', required: true, requiredType: 'Y', defaultValue: '', hint: '参考汇付MCC编码，如 5311-零售', placeholder: '5311' },
        { key: 'scene_type', label: '场景类型 (scene_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: 'ALL', label: 'ALL - 线上线下' }, { value: 'ONLINE', label: 'ONLINE - 线上场景' }, { value: 'OFFLINE', label: 'OFFLINE - 线下场景' }], hint: '交易业务场景类型' },
        { key: 'busi_type', label: '经营类型 (busi_type)', required: false, requiredType: 'C', type: 'select', defaultValue: '', options: [{ value: '1', label: '1 - 实体' }, { value: '2', label: '2 - 虚拟' }], hint: '1:实体，2:虚拟' },
        { key: 'legal_name', label: '负责人姓名 (legal_name)', required: true, requiredType: 'Y', defaultValue: '', hint: '负责人姓名，最大支持16个汉字', placeholder: '张三' },
        { key: 'legal_cert_type', label: '负责人证件类型 (legal_cert_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '00', label: '00 - 居民身份证' }, { value: '01', label: '01 - 护照' }], hint: '负责人有效证件类型' },
        { key: 'legal_cert_no', label: '负责人证件号码 (legal_cert_no)', required: true, requiredType: 'Y', defaultValue: '', hint: '18位身份证号码', placeholder: '310115199001011234' },
        { key: 'legal_cert_validity_type', label: '负责人证件有效期类型 (legal_cert_validity_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '1', label: '1 - 长期有效' }, { value: '0', label: '0 - 非长期有效' }], hint: '证件有效期类型' },
        { key: 'legal_cert_begin_date', label: '负责人证件开始日期 (legal_cert_begin_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd', placeholder: '20200101' },
        { key: 'legal_cert_end_date', label: '负责人证件截止日期 (legal_cert_end_date)', required: false, requiredType: 'C', defaultValue: '', hint: '格式：yyyyMMdd，非长期有效时必填', placeholder: '20400101' },
        { key: 'legal_mobile_no', label: '负责人手机号 (legal_mobile_no)', required: true, requiredType: 'Y', defaultValue: '', hint: '11位手机号', placeholder: '13812345678' },
        { key: 'prov_id', label: '经营省 (prov_id)', required: false, requiredType: 'N', defaultValue: '', hint: '参考地区代码表', placeholder: '310000' },
        { key: 'area_id', label: '经营市 (area_id)', required: false, requiredType: 'N', defaultValue: '', hint: '参考地区代码表', placeholder: '310100' },
        { key: 'district_id', label: '经营区 (district_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '参考地区代码表', placeholder: '310115' },
        { key: 'detail_addr', label: '经营详细地址 (detail_addr)', required: true, requiredType: 'Y', defaultValue: '', hint: '实际经营地址', placeholder: '详细地址' },
        { key: 'contact_email', label: '联系人电子邮箱 (contact_email)', required: true, requiredType: 'Y', defaultValue: '', hint: '电子合同与协议接收邮箱', placeholder: 'email@domain.com' },
        { key: 'login_name', label: '管理员账号 (login_name)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-6), hint: '用于商户平台登录，全局唯一', placeholder: 'huifu001' },
        { key: 'service_phone', label: '客服电话 (service_phone)', required: false, requiredType: 'N', defaultValue: '', hint: '客服电话', placeholder: '021-88888888' },
        { key: 'sms_send_flag', label: '商户通知标识 (sms_send_flag)', required: false, requiredType: 'N', type: 'select', defaultValue: '', options: [{ value: 'M', label: 'M - 短信通知' }, { value: 'E', label: 'E - 邮件通知' }, { value: 'A', label: 'A - 短信和邮件都通知' }], hint: '通知模式' },
        {
          key: 'card_info',
          label: '银行卡信息配置 (card_info)',
          required: true,
          requiredType: 'Y',
          type: 'object',
          hint: '个人同名借记卡配置扩展表单',
          defaultValue: {
            card_type: '1',
            card_name: '张三',
            card_no: '6222021001123456789',
            branch_code: '102100099996',
            prov_id: '310000',
            area_id: '310100',
            cert_type: '00',
            cert_no: '310115199001011234',
          },
          subFields: [
            { key: 'card_type', label: '账户类型', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '1', label: '1 - 对私法人借记卡' }] },
            { key: 'card_name', label: '持卡人姓名', required: true, requiredType: 'Y', placeholder: '张三' },
            { key: 'card_no', label: '银行卡号', required: true, requiredType: 'Y', placeholder: '借记卡卡号' },
            { key: 'branch_code', label: '开户行联行号', required: false, requiredType: 'N', placeholder: '联行号' },
            { key: 'prov_id', label: '银行省代码', required: false, requiredType: 'N', placeholder: '310000' },
            { key: 'area_id', label: '银行市代码', required: false, requiredType: 'N', placeholder: '310100' },
          ],
        },
        {
          key: 'settle_config',
          label: '结算业务配置 (settle_config)',
          required: false,
          requiredType: 'N',
          type: 'object',
          hint: '结算规则配置扩展表单',
          defaultValue: {
            settle_cycle: 'T1',
            min_amt: '1.00',
            remained_amt: '0.00',
            settle_abstract: '结算打款',
            out_settle_flag: '2',
            settle_pattern: 'P0',
          },
          subFields: [
            { key: 'settle_cycle', label: '结算周期', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: 'T1', label: 'T1 - 工作日次日结算' }, { value: 'D1', label: 'D1 - 自然日次日结算' }, { value: 'TS', label: 'TS - 笔笔结算' }] },
            { key: 'min_amt', label: '起结金额 (元)', required: false, requiredType: 'N', placeholder: '1.00' },
            { key: 'remained_amt', label: '留存金额 (元)', required: false, requiredType: 'N', placeholder: '0.00' },
            { key: 'settle_abstract', label: '结算摘要', required: false, requiredType: 'N', placeholder: '结算备注' },
            { key: 'out_settle_flag', label: '手续费外扣标记', required: false, requiredType: 'N', type: 'select', defaultValue: '', options: [{ value: '2', label: '2 - 内扣' }, { value: '1', label: '1 - 外扣' }] },
          ],
        },
        {
          key: 'cash_config',
          label: '取现业务配置 (cash_config)',
          required: false,
          requiredType: 'N',
          type: 'array',
          hint: '个人商户取现规则配置',
          defaultValue: [
            { cash_type: 'D0', fix_amt: '1.00', fee_rate: '0.00', out_fee_flag: '2' },
          ],
          subFields: [
            { key: 'cash_type', label: '取现类型', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: 'D0', label: 'D0 - 当日到账' }, { value: 'T1', label: 'T1 - 下个工作日到账' }, { value: 'D1', label: 'D1 - 下个自然日到账' }] },
            { key: 'fix_amt', label: '固定手续费 (元)', required: false, requiredType: 'C', placeholder: '1.00' },
            { key: 'fee_rate', label: '手续费率 (%)', required: false, requiredType: 'C', placeholder: '0.00' },
            { key: 'out_fee_flag', label: '是否手续费外扣', required: false, requiredType: 'N', type: 'select', defaultValue: '', options: [{ value: '2', label: '2 - 内扣' }, { value: '1', label: '1 - 外扣' }] },
          ],
        },
        { key: 'legal_cert_front_pic', label: '身份证人像面 (legal_cert_front_pic)', required: true, requiredType: 'Y', defaultValue: '', hint: '文件类型 F02', placeholder: 'File ID' },
        { key: 'legal_cert_back_pic', label: '身份证国徽面 (legal_cert_back_pic)', required: true, requiredType: 'Y', defaultValue: '', hint: '文件类型 F03', placeholder: 'File ID' },
        { key: 'store_header_pic', label: '店铺门头照 (store_header_pic)', required: false, requiredType: 'C', defaultValue: '', hint: '线下场景必填 (文件类型: F22)', placeholder: 'File ID' },
        { key: 'store_indoor_pic', label: '店铺内景照 (store_indoor_pic)', required: false, requiredType: 'C', defaultValue: '', hint: '线下场景必填 (文件类型: F24)', placeholder: 'File ID' },
        { key: 'settle_card_front_pic', label: '银行卡卡号面 (settle_card_front_pic)', required: true, requiredType: 'Y', defaultValue: '', hint: '文件类型: F13', placeholder: 'File ID' },
        { key: 'ext_mer_id', label: '外部商户号 (ext_mer_id)', required: false, requiredType: 'N', defaultValue: '' + Date.now().toString().slice(-6), hint: '外部商户系统自定义编码', placeholder: 'HF100001' },
        { key: 'async_return_url', label: '异步请求地址 (async_return_url)', required: false, requiredType: 'N', defaultValue: '', hint: '审核结果Webhook通知地址', placeholder: 'http://...' },
      ],
    },
    {
      id: 'merch_busi_base_modify',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '商户基本信息修改',
      api: 'v2/merchant/busi/modify',
      ep: '/api/huifu/merchant/modify',
      method: 'POST',
      desc: '修改商户名称、注册地址、联系方式等基本登记信息',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '汇付商户ID', placeholder: '6666...' },
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：YYYYMMDD', placeholder: '20260829' },
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '唯一流水号', placeholder: 'BASEMOD...' },
        { key: 'short_name', label: '新商户简称 (short_name)', required: false, requiredType: 'N', defaultValue: '', hint: '更新商户对外简称', placeholder: '新商户简称' },
        { key: 'service_phone', label: '新客服电话 (service_phone)', required: false, requiredType: 'N', defaultValue: '', hint: '更新客服电话', placeholder: '新客服电话' },
        { key: 'contact_mobile', label: '新联系人手机 (contact_mobile)', required: false, requiredType: 'N', defaultValue: '', hint: '更新管理员手机', placeholder: '新手机号' },
        { key: 'contact_email', label: '新联系人邮箱 (contact_email)', required: false, requiredType: 'N', defaultValue: '', hint: '更新管理员邮箱', placeholder: 'email@...' },
        { key: 'detail_addr', label: '新经营详细地址 (detail_addr)', required: false, requiredType: 'N', defaultValue: '', hint: '更新经营详细地址', placeholder: '详细地址' },
      ],
    },
    {
      id: 'merch_busi_open',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '商户业务开通',
      api: 'v2/merchant/busi/open',
      ep: '/api/huifu/merchant/busi/open',
      method: 'POST',
      desc: '为已进件商户开通特定收单渠道（微信/支付宝/银联/网关）并配置交易签约费率',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '汇付商户唯一ID', placeholder: '6666...' },
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：YYYYMMDD', placeholder: '20260829' },
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '业务请求流水号', placeholder: 'BUSIREQ...' },
        { key: 'pay_type', label: '业务模式 (pay_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '01', label: '01 - 直连聚合收单' }, { value: '02', label: '02 - 平台分账结算' }, { value: '03', label: '03 - 预付卡受理' }], hint: '开通业务模式' },
        { key: 'pay_channel', label: '开通支付渠道 (pay_channel)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: 'WXPAY', label: 'WXPAY - 微信支付' }, { value: 'ALIPAY', label: 'ALIPAY - 支付宝' }, { value: 'UNIONPAY', label: 'UNIONPAY - 银联二维码' }, { value: 'QUICKPAY', label: 'QUICKPAY - 快捷支付' }, { value: 'GATEWAY', label: 'GATEWAY - B2C/B2B网银支付' }], hint: '目标开通通道' },
        { key: 'rate', label: '商户签约扣率 % (rate)', required: true, requiredType: 'Y', defaultValue: '', hint: '交易手续费百分比 (如 0.38 表示 0.38%)', placeholder: '0.38' },
        { key: 'fixed_amt', label: '固定手续费 (元) (fixed_amt)', required: false, requiredType: 'N', defaultValue: '', hint: '笔笔固定手续费', placeholder: '0.00' },
      ],
    },
    {
      id: 'merch_busi_modify',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '商户业务开通修改',
      api: 'v2/merchant/busi/modify',
      ep: '/api/huifu/merchant/modify',
      method: 'POST',
      desc: '变更商户的结算银行账户、经营地址、联系方式或支付费率',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '汇付商户唯一ID', placeholder: '6666...' },
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：YYYYMMDD', placeholder: '20260829' },
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '本次修改请求唯一流水号', placeholder: 'MODREQ...' },
        { key: 'modify_type', label: '变更范围类型 (modify_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '01', label: '01 - 结算银行账户变更' }, { value: '02', label: '02 - 联系人与客服电话变更' }, { value: '03', label: '03 - 实际经营地址变更' }, { value: '04', label: '04 - 通道签约扣率调整' }], hint: '选择修改业务范围' },
        { key: 'card_no', label: '新结算银行账号 (card_no)', required: false, requiredType: 'N', defaultValue: '', hint: '选填，新结算银行卡号', placeholder: '新银行卡号' },
        { key: 'branch_code', label: '新开户行联行号 (branch_code)', required: false, requiredType: 'N', defaultValue: '', hint: '对公变更必填', placeholder: '12位联行号' },
      ],
    },
    {
      id: 'merch_busi_query',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '商户详细信息查询',
      api: 'v2/merchant/busi/query',
      ep: '/api/huifu/merchant/query',
      method: 'POST',
      desc: '查询商户已入驻的详细资质、结算账户、签约状态与已开通支付通道清单',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '汇付分配的商户全局唯一ID', placeholder: '6666...' },
      ],
    },
    {
      id: 'merch_sub_config',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '开通下级商户权限配置接口',
      api: 'v2/merchant/busi/sub/config',
      ep: '/api/huifu/merchant/sub/config',
      method: 'POST',
      desc: '为连锁总部或平台母商户开通发展下级商户、授权独立收单及统一清算结算的管理权限',
      fields: [
        { key: 'parent_huifu_id', label: '母商户/总部商户号 (parent_huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '具有上级管理权限的汇付ID', placeholder: '6666...' },
        { key: 'sub_huifu_id', label: '下级商户号 (sub_huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '需要授权的下级商户ID', placeholder: '6666...' },
        { key: 'auth_type', label: '授权类型 (auth_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '01', label: '01 - 允许独立收单与结算' }, { value: '02', label: '02 - 归属总部统一结算' }] },
      ],
    },
    {
      id: 'merch_atone_open',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '商户统一进件（简易版）',
      api: 'v2/merchant/busi/atone/open',
      ep: '/api/huifu/merchant/atone/open',
      method: 'POST',
      desc: '一站式极速进件模式，整合基本信息登记、银行卡绑定及收单通道费率开通为单次请求',
      fields: [
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '业务请求流水号', placeholder: 'ATONE...' },
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：YYYYMMDD', placeholder: '20260829' },
        { key: 'reg_name', label: '商户全称 (reg_name)', required: true, requiredType: 'Y', defaultValue: '', hint: '企业营业执照全称', placeholder: '商户全称' },
        { key: 'short_name', label: '商户简称 (short_name)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户简称', placeholder: '极速数字' },
        { key: 'legal_name', label: '法人姓名 (legal_name)', required: true, requiredType: 'Y', defaultValue: '', hint: '法人姓名', placeholder: '张三' },
        { key: 'legal_cert_no', label: '法人身份证号 (legal_cert_no)', required: true, requiredType: 'Y', defaultValue: '', hint: '18位身份证号', placeholder: '310115...' },
        { key: 'contact_mobile', label: '联系人手机号 (contact_mobile)', required: true, requiredType: 'Y', defaultValue: '', hint: '联系人手机', placeholder: '13812345678' },
      ],
    },
    {
      id: 'merch_page_query',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '统一进件页面版查询',
      api: 'v2/merchant/busi/page/query',
      ep: '/api/huifu/merchant/page/query',
      method: 'POST',
      desc: '查询通过 H5/PC 页面版自流入驻进件的商户填写进度与身份核验状态',
      fields: [
        { key: 'apply_id', label: '页面进件申请单号 (apply_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '页面进件返回的流水单号', placeholder: 'PAGEAPPLY...' },
      ],
    },
    {
      id: 'merch_media_upload',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '图片上传',
      api: 'v2/supplement/file/upload',
      ep: '/api/huifu/media/upload',
      method: 'POST',
      desc: '上传营业执照、身份证、开户证明等商户资质影印件并换取全局 File ID',
      fields: [
        { key: 'file_type', label: '资质文件类型 (file_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: 'F07', label: 'F07 - 营业执照照片' }, { value: 'F02', label: 'F02 - 法人身份证人像面' }, { value: 'F03', label: 'F03 - 法人身份证国徽面' }, { value: 'F08', label: 'F08 - 开户许可证/印鉴卡' }, { value: 'F13', label: 'F13 - 银行卡卡号面' }, { value: 'F22', label: 'F22 - 店铺门头招牌照' }, { value: 'F24', label: 'F24 - 店铺内部经营场景照' }, { value: 'F105', label: 'F105 - 店铺收银台/前台照' }, { value: 'F15', label: 'F15 - 业务授权委托书' }], hint: '上传文件所属资质分类' },
        { key: 'file_name', label: '文件名称 (file_name)', required: true, requiredType: 'Y', defaultValue: '', hint: '包含扩展名的文件名', placeholder: 'license.png' },
        { key: 'file_content', label: '文件Base64编码 (file_content)', required: true, requiredType: 'Y', defaultValue: '', hint: '图片Base64编码数据流', placeholder: 'Base64字符串' },
      ],
    },
    {
      id: 'merch_apply_query',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '申请单状态查询',
      api: 'v2/merchant/busi/status/query',
      ep: '/api/huifu/apply/status/query',
      method: 'POST',
      desc: '查询入驻申请单的银联/微信/支付宝渠道审批进度与驳回原因明细',
      fields: [
        { key: 'apply_id', label: '申请单号 (apply_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '进件提交后返回的申请单ID', placeholder: 'APPLY...' },
      ],
    },
    {
      id: 'merch_sms_send',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '商户短信发送',
      api: 'v2/merchant/sms/send',
      ep: '/api/huifu/merchant/sms/send',
      method: 'POST',
      desc: '向商户负责人发送签约通知、协议签署链接或结算打款核验验证码',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '汇付商户号', placeholder: '6666...' },
        { key: 'mobile_no', label: '接收手机号 (mobile_no)', required: true, requiredType: 'Y', defaultValue: '', hint: '接收通知短信的有效手机号', placeholder: '13812345678' },
      ],
    },
    {
      id: 'merch_status_modify',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '商户状态变更',
      api: 'v2/merchant/status/modify',
      ep: '/api/huifu/merchant/status/modify',
      method: 'POST',
      desc: '执行商户的冻结交易、解冻恢复正常收单或彻底注销销户',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '汇付商户号', placeholder: '6666...' },
        { key: 'status_type', label: '目标变更状态 (status_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '01', label: '01 - 解冻 / 恢复正常交易与结算' }, { value: '02', label: '02 - 冻结 / 暂停交易与结算' }, { value: '03', label: '03 - 注销 / 关闭商户账户' }], hint: '选择目标状态' },
      ],
    },
    {
      id: 'merch_fee_query',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '商户费率信息查询',
      api: 'v2/merchant/fee/query',
      ep: '/api/huifu/merchant/fee/query',
      method: 'POST',
      desc: '查询商户已生效的微信、支付宝、银联及银行卡刷卡签约费率清单',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户汇付ID', placeholder: '6666...' },
      ],
    },
    {
      id: 'merch_fee_config',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '商户多费率配置',
      api: 'v2/merchant/fee/config',
      ep: '/api/huifu/merchant/fee/config',
      method: 'POST',
      desc: '一键批量配置商户微信、支付宝、银联二维码及刷卡的多场景签约费率',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '汇付商户号', placeholder: '6666...' },
        { key: 'wx_rate', label: '微信支付费率 % (wx_rate)', required: true, requiredType: 'Y', defaultValue: '', hint: '如 0.38 表示 0.38%', placeholder: '0.38' },
        { key: 'ali_rate', label: '支付宝费率 % (ali_rate)', required: true, requiredType: 'Y', defaultValue: '', hint: '如 0.38 表示 0.38%', placeholder: '0.38' },
        { key: 'union_rate', label: '银联二维码费率 % (union_rate)', required: true, requiredType: 'Y', defaultValue: '', hint: '如 0.38 表示 0.38%', placeholder: '0.38' },
      ],
    },
    {
      id: 'merch_fee_config_query',
      category: 'merchant_onboarding',
      categoryLabel: '商户进件',
      label: '商户多费率配置查询',
      api: 'v2/merchant/fee/config/query',
      ep: '/api/huifu/merchant/fee/config/query',
      method: 'POST',
      desc: '查询商户多场景多通道手续费率配置的审核状态与历史变更记录',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户汇付ID', placeholder: '6666...' },
      ],
    },
  ];

  // ================= 2. 用户进件 (9 接口，按官方规范 1:1 顺序排列) =================
  const userOnboardingMenus: ApiMenuItem[] = [
    {
      id: 'user_comp_open',
      category: 'user_onboarding',
      categoryLabel: '用户进件',
      label: '企业用户基本信息开户',
      api: 'v2/user/busi/company/open',
      ep: '/api/huifu/user/company/open',
      method: 'POST',
      desc: '为平台企业级机构用户开设电子账户基本资料',
      fields: [
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '请求流水号', placeholder: 'UCOMP...' },
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：YYYYMMDD', placeholder: '20260829' },
        { key: 'user_id', label: '平台用户ID (user_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '业务系统内部唯一企业编号', placeholder: 'COMP...' },
        { key: 'reg_name', label: '企业全称 (reg_name)', required: true, requiredType: 'Y', defaultValue: '', hint: '企业营业执照全称', placeholder: '企业全称' },
        { key: 'license_code', label: '统一社会信用代码 (license_code)', required: true, requiredType: 'Y', defaultValue: '', hint: '18位统一信用代码', placeholder: '9131...' },
        { key: 'legal_name', label: '法人姓名 (legal_name)', required: true, requiredType: 'Y', defaultValue: '', hint: '法定代表人姓名', placeholder: '张三' },
        { key: 'legal_cert_no', label: '法人身份证号 (legal_cert_no)', required: true, requiredType: 'Y', defaultValue: '', hint: '法人18位身份证号码', placeholder: '310115...' },
        { key: 'contact_mobile', label: '管理员手机 (contact_mobile)', required: true, requiredType: 'Y', defaultValue: '', hint: '管理员实名手机号', placeholder: '13812345678' },
      ],
    },
    {
      id: 'user_comp_modify',
      category: 'user_onboarding',
      categoryLabel: '用户进件',
      label: '企业用户基本信息修改',
      api: 'v2/user/busi/company/modify',
      ep: '/api/huifu/user/company/modify',
      method: 'POST',
      desc: '变更已开户企业用户的联系人或基本工商登记信息',
      fields: [
        { key: 'user_huifu_id', label: '用户汇付ID (user_huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '开户时分配的用户汇付唯一号', placeholder: '6666...' },
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：YYYYMMDD', placeholder: '20260829' },
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '请求流水号', placeholder: 'UCOMPMOD...' },
        { key: 'contact_mobile', label: '新管理员手机 (contact_mobile)', required: false, requiredType: 'N', defaultValue: '', hint: '变更管理员手机', placeholder: '139...' },
      ],
    },
    {
      id: 'user_indv_open',
      category: 'user_onboarding',
      categoryLabel: '用户进件',
      label: '个人用户基本信息开户',
      api: 'v2/user/busi/indv/open',
      ep: '/api/huifu/user/indv/open',
      method: 'POST',
      desc: '为平台 C 端个人买家/个人卖家开通电子账户',
      fields: [
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '请求流水号', placeholder: 'UINDV...' },
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：YYYYMMDD', placeholder: '20260829' },
        { key: 'user_id', label: '平台用户ID (user_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '平台内唯一用户ID', placeholder: 'INDV...' },
        { key: 'user_name', label: '用户真实姓名 (user_name)', required: true, requiredType: 'Y', defaultValue: '', hint: '实名认证真实姓名', placeholder: '姓名' },
        { key: 'cert_type', label: '证件类型 (cert_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '00', label: '00 - 居民身份证' }, { value: '01', label: '01 - 护照' }] },
        { key: 'cert_no', label: '身份证号码 (cert_no)', required: true, requiredType: 'Y', defaultValue: '', hint: '18位身份证号', placeholder: '310115...' },
        { key: 'mobile_no', label: '实名手机号 (mobile_no)', required: true, requiredType: 'Y', defaultValue: '', hint: '银行预留手机号', placeholder: '13912345678' },
      ],
    },
    {
      id: 'user_indv_modify',
      category: 'user_onboarding',
      categoryLabel: '用户进件',
      label: '个人用户基本信息修改',
      api: 'v2/user/busi/indv/modify',
      ep: '/api/huifu/user/indv/modify',
      method: 'POST',
      desc: '变更个人用户的实名绑定手机号或更新证件资料',
      fields: [
        { key: 'user_huifu_id', label: '用户汇付ID (user_huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '个人用户汇付ID', placeholder: '6666...' },
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：YYYYMMDD', placeholder: '20260829' },
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '请求流水号', placeholder: 'UINDVMOD...' },
        { key: 'mobile_no', label: '新实名手机号 (mobile_no)', required: false, requiredType: 'N', defaultValue: '', hint: '变更后手机号', placeholder: '138...' },
      ],
    },
    {
      id: 'user_busi_open',
      category: 'user_onboarding',
      categoryLabel: '用户进件',
      label: '用户业务入驻',
      api: 'v2/user/busi/open',
      ep: '/api/huifu/user/busi/open',
      method: 'POST',
      desc: '为已开户用户开通电子钱包、分销分账或供应链账户权限',
      fields: [
        { key: 'user_huifu_id', label: '用户汇付ID (user_huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '已开户的用户汇付唯一ID', placeholder: '6666...' },
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：YYYYMMDD', placeholder: '20260829' },
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '业务请求流水号', placeholder: 'UBUSI...' },
        { key: 'busi_type', label: '业务类型 (busi_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '01', label: '01 - 钱包分账账户' }, { value: '02', label: '02 - 供应链出金' }] },
      ],
    },
    {
      id: 'user_busi_modify',
      category: 'user_onboarding',
      categoryLabel: '用户进件',
      label: '用户业务入驻修改',
      api: 'v2/user/busi/modify',
      ep: '/api/huifu/user/busi/modify',
      method: 'POST',
      desc: '启用或暂停已入驻用户的特定业务结算功能',
      fields: [
        { key: 'user_huifu_id', label: '用户汇付ID (user_huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '用户汇付ID', placeholder: '6666...' },
        { key: 'status', label: '业务功能状态 (status)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '1', label: '1 - 启用' }, { value: '0', label: '0 - 冻结/暂停' }] },
      ],
    },
    {
      id: 'user_info_query',
      category: 'user_onboarding',
      categoryLabel: '用户进件',
      label: '用户信息查询',
      api: 'v2/user/busi/query',
      ep: '/api/huifu/user/query',
      method: 'POST',
      desc: '查询个人或企业用户的基本信息、证件状态与业务权限',
      fields: [
        { key: 'user_huifu_id', label: '用户汇付ID (user_huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '用户汇付全局ID', placeholder: '6666...' },
      ],
    },
    {
      id: 'user_list_query',
      category: 'user_onboarding',
      categoryLabel: '用户进件',
      label: '用户列表查询',
      api: 'v2/user/busi/list/query',
      ep: '/api/huifu/user/list/query',
      method: 'POST',
      desc: '分页多条件查询商户名下所有用户入驻清单',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '归属商户号', placeholder: '6666...' },
        { key: 'page_num', label: '当前页码 (page_num)', required: true, requiredType: 'Y', defaultValue: '', hint: '从 1 开始', placeholder: '1' },
        { key: 'page_size', label: '每页条数 (page_size)', required: true, requiredType: 'Y', defaultValue: '', hint: '默认20，最大100', placeholder: '20' },
      ],
    },
    {
      id: 'user_apply_query',
      category: 'user_onboarding',
      categoryLabel: '用户进件',
      label: '用户申请单状态查询',
      api: 'v2/user/busi/status/query',
      ep: '/api/huifu/user/status/query',
      method: 'POST',
      desc: '查询用户开户或业务入驻申请单的审批状态',
      fields: [
        { key: 'apply_id', label: '用户申请单号 (apply_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '用户进件返回的申请单号', placeholder: 'USERAPPLY...' },
      ],
    },
  ];

    // ================= 3. 支付产品 (5 接口，官方标准全量参数 1:1 对齐) =================
  const paymentMenus: ApiMenuItem[] = [
    {
      id: 'jspay',
      category: 'payment_product',
      categoryLabel: '支付产品',
      label: '聚合正扫',
      api: 'v2/trade/payment/jspay',
      ep: '/api/huifu/trade/jspay',
      method: 'POST',
      desc: '用户主动扫商户呈现的二维码（微信公众号/小程序、支付宝JSAPI/正扫、银联JS、聚合动态码等）调起支付。',
      fields: [
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd (默认填充当日，支持修改)', placeholder: '20260829' },
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户订单号，全局唯一 (自动生成，支持修改)', placeholder: 'REQ_JSPAY_...' },
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '6666000109133323', hint: '收款商户汇付ID (默认生产商户号)', placeholder: '6666000109133323' },
        {
          key: 'trade_type',
          label: '交易类型 (trade_type)',
          required: true,
          requiredType: 'Y',
          type: 'select',
          defaultValue: 'T_MINIAPP',
          hint: '支付场景与渠道标识',
          options: [
            { value: 'T_MINIAPP', label: 'T_MINIAPP - 微信小程序支付' },
            { value: 'T_JSAPI', label: 'T_JSAPI - 微信公众号支付' },
            { value: 'A_JSAPI', label: 'A_JSAPI - 支付宝服务窗/小程序支付' },
            { value: 'A_NATIVE', label: 'A_NATIVE - 支付宝正扫 (返回二维码URL)' },
            { value: 'T_NATIVE', label: 'T_NATIVE - 微信Native正扫 (返回二维码URL)' },
            { value: 'U_JSAPI', label: 'U_JSAPI - 银联JS支付' },
            { value: 'U_NATIVE', label: 'U_NATIVE - 银联正扫' },
            { value: 'D_PASSTHROUGH', label: 'D_PASSTHROUGH - 聚合动态码 (一码多扫)' },
          ],
        },
        { key: 'trans_amt', label: '交易金额 (元) (trans_amt)', required: true, requiredType: 'Y', defaultValue: '', hint: '支付金额，保留两位小数，如 0.01', placeholder: '0.01' },
        { key: 'goods_desc', label: '商品描述 (goods_desc)', required: true, requiredType: 'Y', defaultValue: '', hint: '商品简称或消费账单名称', placeholder: '测试商品' },
        {
          key: 'pay_scene',
          label: '手续费场景 (pay_scene)',
          required: false,
          requiredType: 'N',
          type: 'select',
          defaultValue: '01',
          hint: '支付场景费率分类',
          options: [
            { value: '01', label: '01 - 线上普通标准费率' },
            { value: '02', label: '02 - 线下普通标准费率' },
            { value: '03', label: '03 - 非营利性费率' },
            { value: '04', label: '04 - 公共缴费/民生类' },
          ],
        },
        { key: 'time_expire', label: '交易超时时间 (time_expire)', required: false, requiredType: 'N', defaultValue: '', hint: '格式：yyyyMMddHHmmss', placeholder: '20260829235959' },
        { key: 'notify_url', label: '异步通知地址 (notify_url)', required: false, requiredType: 'N', defaultValue: '', hint: '汇付支付结果异步回调通知URL', placeholder: 'https://...' },
        {
          key: 'delay_acct_flag',
          label: '延迟分账标记 (delay_acct_flag)',
          required: false,
          requiredType: 'N',
          type: 'select',
          defaultValue: 'N',
          hint: '是否延迟分账入账',
          options: [
            { value: 'N', label: 'N - 否 (直接入账)' },
            { value: 'Y', label: 'Y - 是 (延迟分账)' },
          ],
        },
        {
          key: 'limit_pay_type',
          label: '限制支付方式 (limit_pay_type)',
          required: false,
          requiredType: 'N',
          type: 'select',
          defaultValue: '',
          hint: '限制用户可用的支付渠道',
          options: [
            { value: '', label: '无限制 (默认)' },
            { value: 'NO_CREDIT', label: 'NO_CREDIT - 禁用信用卡' },
          ],
        },
        {
          key: 'wx_data',
          label: '微信支付扩展参数 (wx_data)',
          type: 'object',
          required: false,
          requiredType: 'C',
          hint: '微信支付时必填 sub_openid 或 openid',
          subFields: [
            { key: 'sub_appid', label: '子商户AppID (sub_appid)', required: false, requiredType: 'N', defaultValue: '', hint: '微信小程序/公众号AppID', placeholder: 'wx...' },
            { key: 'sub_openid', label: '子商户OpenID (sub_openid)', required: false, requiredType: 'C', defaultValue: '', hint: '用户在子商户AppID下的OpenID', placeholder: 'oUpF8u...' },
            { key: 'openid', label: '主商户OpenID (openid)', required: false, requiredType: 'N', defaultValue: '', hint: '用户在主商户AppID下的OpenID', placeholder: 'oUpF8u...' },
            { key: 'user_id', label: '汇付用户ID (user_id)', required: false, requiredType: 'N', defaultValue: '', hint: '汇付开户的用户ID', placeholder: '6666...' },
          ],
        },
        {
          key: 'alipay_data',
          label: '支付宝扩展参数 (alipay_data)',
          type: 'object',
          required: false,
          requiredType: 'C',
          hint: '支付宝JS支付时必填 buyer_id',
          subFields: [
            { key: 'buyer_id', label: '买家支付宝用户ID (buyer_id)', required: false, requiredType: 'C', defaultValue: '', hint: '2088开头的16位支付宝用户ID', placeholder: '2088...' },
            { key: 'buyer_logon_id', label: '买家支付宝账号 (buyer_logon_id)', required: false, requiredType: 'N', defaultValue: '', hint: '脱敏的支付宝登录号', placeholder: '138***@163.com' },
            { key: 'hb_fq_num', label: '花呗分期期数 (hb_fq_num)', required: false, requiredType: 'N', type: 'select', defaultValue: '', hint: '花呗分期', options: [{ value: '', label: '不分期' }, { value: '3', label: '3期' }, { value: '6', label: '6期' }, { value: '12', label: '12期' }] },
          ],
        },
        {
          key: 'unionpay_data',
          label: '银联JS支付扩展参数 (unionpay_data)',
          type: 'object',
          required: false,
          requiredType: 'N',
          hint: '银联JS支付参数',
          subFields: [
            { key: 'user_id', label: '云闪付用户标识 (user_id)', required: false, requiredType: 'N', defaultValue: '', hint: '银联OpenID', placeholder: 'UP...' },
            { key: 'app_up_identifier', label: '银联App标识', required: false, requiredType: 'N', defaultValue: '', hint: '云闪付APP标识', placeholder: 'CloudPay' },
          ],
        },
        {
          key: 'terminal_device_data',
          label: '终端设备信息 (terminal_device_data)',
          type: 'object',
          required: false,
          requiredType: 'N',
          hint: '防钓鱼及风控设备数据',
          subFields: [
            { key: 'device_ip', label: '终端用户IP (device_ip)', required: false, requiredType: 'N', defaultValue: '', hint: '发起支付的用户真实公网IP', placeholder: '127.0.0.1' },
            { key: 'device_type', label: '设备类型 (device_type)', required: false, requiredType: 'N', type: 'select', defaultValue: '1', options: [{ value: '1', label: '1 - 移动端手机' }, { value: '2', label: '2 - 智能POS机具' }, { value: '3', label: '3 - PC网页' }] },
            { key: 'device_id', label: '设备序列号 (device_id)', required: false, requiredType: 'N', defaultValue: '', hint: 'POS终端号或SN码', placeholder: 'POS001' },
          ],
        },
        {
          key: 'acct_split_bunch',
          label: '分账接收方列表 (acct_split_bunch)',
          type: 'array',
          required: false,
          requiredType: 'N',
          hint: '交易多方分账规则配置',
          subFields: [
            { key: 'huifu_id', label: '分账方商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '接收分账资金的商户号/用户ID', placeholder: '6666...' },
            { key: 'div_amt', label: '分账固定金额(元) (div_amt)', required: false, requiredType: 'N', defaultValue: '', hint: '如 0.01', placeholder: '0.01' },
            { key: 'percentage', label: '分账比例(%) (percentage)', required: false, requiredType: 'N', defaultValue: '', hint: '按百分比，如 10.00', placeholder: '10.00' },
            { key: 'fee_flag', label: '手续费承担方 (fee_flag)', required: false, requiredType: 'N', type: 'select', defaultValue: 'N', options: [{ value: 'N', label: 'N - 不承担手续费' }, { value: 'Y', label: 'Y - 承担手续费' }] },
          ],
        },
        { key: 'risk_check_data', label: '风控数据 (risk_check_data)', required: false, requiredType: 'N', defaultValue: '', hint: '特定行业定制风控字段', placeholder: '{"risk": "..."}' },
        { key: 'remark', label: '订单备注 (remark)', required: false, requiredType: 'N', defaultValue: '', hint: '商户自定义备注信息', placeholder: '正扫测试订单' },
      ],
    },
    {
      id: 'micropay',
      category: 'payment_product',
      categoryLabel: '支付产品',
      label: '聚合反扫',
      api: 'v2/trade/payment/micropay',
      ep: '/api/huifu/trade/micropay',
      method: 'POST',
      desc: '收银枪/POS扫描消费者出示的微信/支付宝付款码完成即时扣款',
      fields: [
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd (默认填充当日，支持修改)', placeholder: '20260829' },
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户订单号，全局唯一 (自动生成，支持修改)', placeholder: 'REQ_MICRO_...' },
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '6666000109133323', hint: '收款商户汇付ID', placeholder: '6666000109133323' },
        { key: 'trans_amt', label: '交易金额 (元) (trans_amt)', required: true, requiredType: 'Y', defaultValue: '', hint: '交易金额 (元)，保留两位小数', placeholder: '0.01' },
        { key: 'auth_code', label: '付款码 (auth_code)', required: true, requiredType: 'Y', defaultValue: '', hint: '条码枪扫到的18位微信/18-24位支付宝付款码', placeholder: '134567890123456789' },
        { key: 'goods_desc', label: '商品描述 (goods_desc)', required: true, requiredType: 'Y', defaultValue: '', hint: '小票商品名称', placeholder: '便利店消费' },
        {
          key: 'pay_scene',
          label: '手续费场景 (pay_scene)',
          required: false,
          requiredType: 'N',
          type: 'select',
          defaultValue: '02',
          hint: '02 - 线下普通标准费率',
          options: [
            { value: '02', label: '02 - 线下普通标准费率' },
            { value: '01', label: '01 - 线上普通标准费率' },
          ],
        },
        { key: 'time_expire', label: '交易超时时间 (time_expire)', required: false, requiredType: 'N', defaultValue: '', hint: '格式：yyyyMMddHHmmss', placeholder: '20260829235959' },
        { key: 'notify_url', label: '异步通知地址 (notify_url)', required: false, requiredType: 'N', defaultValue: '', hint: '支付成功Webhook回调', placeholder: 'https://...' },
        {
          key: 'delay_acct_flag',
          label: '延迟分账标记 (delay_acct_flag)',
          required: false,
          requiredType: 'N',
          type: 'select',
          defaultValue: 'N',
          hint: '是否延迟分账入账',
          options: [
            { value: 'N', label: 'N - 否 (直接入账)' },
            { value: 'Y', label: 'Y - 是 (延迟分账)' },
          ],
        },
        {
          key: 'terminal_device_data',
          label: '终端设备信息 (terminal_device_data)',
          type: 'object',
          required: false,
          requiredType: 'N',
          hint: '防钓鱼及风控设备数据',
          subFields: [
            { key: 'device_ip', label: '终端用户IP (device_ip)', required: false, requiredType: 'N', defaultValue: '', hint: '发起支付的收银机IP', placeholder: '127.0.0.1' },
            { key: 'device_type', label: '设备类型 (device_type)', required: false, requiredType: 'N', type: 'select', defaultValue: '2', options: [{ value: '2', label: '2 - 智能POS机具/条码枪' }, { value: '1', label: '1 - 移动端' }] },
            { key: 'device_id', label: '设备序列号 (device_id)', required: false, requiredType: 'N', defaultValue: '', hint: 'POS终端号或SN码', placeholder: 'POS001' },
          ],
        },
        {
          key: 'acct_split_bunch',
          label: '分账接收方列表 (acct_split_bunch)',
          type: 'array',
          required: false,
          requiredType: 'N',
          hint: '交易多方分账规则配置',
          subFields: [
            { key: 'huifu_id', label: '分账方商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '接收分账资金的商户号/用户ID', placeholder: '6666...' },
            { key: 'div_amt', label: '分账固定金额(元) (div_amt)', required: false, requiredType: 'N', defaultValue: '', hint: '如 0.01', placeholder: '0.01' },
            { key: 'percentage', label: '分账比例(%) (percentage)', required: false, requiredType: 'N', defaultValue: '', hint: '按百分比，如 10.00', placeholder: '10.00' },
          ],
        },
        { key: 'remark', label: '订单备注 (remark)', required: false, requiredType: 'N', defaultValue: '', hint: '商户自定义备注信息', placeholder: '反扫测试订单' },
      ],
    },
    {
      id: 'order_query',
      category: 'payment_product',
      categoryLabel: '支付产品',
      label: '交易订单明细查询',
      api: 'v2/trade/payment/scanpay/query',
      ep: '/api/huifu/trade/query',
      method: 'POST',
      desc: '查询扫码交易订单的实时支付状态、金额及结算信息',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '6666000109133323', hint: '商户汇付ID', placeholder: '6666000109133323' },
        { key: 'org_req_date', label: '原交易请求日期 (org_req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '原支付交易日期 yyyyMMdd (默认当日)', placeholder: '20260829' },
        { key: 'org_req_seq_id', label: '原交易请求流水号 (org_req_seq_id)', required: false, requiredType: 'C', defaultValue: '', hint: '原请求流水号 (与原汇付流水二选一)', placeholder: 'REQ_JSPAY_...' },
        { key: 'org_hf_seq_id', label: '原交易汇付流水号 (org_hf_seq_id)', required: false, requiredType: 'C', defaultValue: '', hint: '汇付全局订单流水号', placeholder: 'HF...' },
        { key: 'out_ord_id', label: '外部订单号 (out_ord_id)', required: false, requiredType: 'N', defaultValue: '', hint: '商户外部订单编号', placeholder: 'ORD...' },
      ],
    },
    {
      id: 'refund',
      category: 'payment_product',
      categoryLabel: '支付产品',
      label: '交易退款申请',
      api: 'v2/trade/payment/scanpay/refund',
      ep: '/api/huifu/trade/refund',
      method: 'POST',
      desc: '对已支付成功的订单发起原路全额或部分退款',
      fields: [
        { key: 'req_date', label: '退款请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd (默认当日)', placeholder: '20260829' },
        { key: 'req_seq_id', label: '退款请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '本次退款唯一流水号 (自动生成)', placeholder: 'REQ_REFUND_...' },
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '6666000109133323', hint: '原交易商户号', placeholder: '6666000109133323' },
        { key: 'ord_amt', label: '申请退款金额 (元) (ord_amt)', required: true, requiredType: 'Y', defaultValue: '', hint: '退款金额需小于等于原支付剩余金额', placeholder: '0.01' },
        { key: 'org_req_date', label: '原交易日期 (org_req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '原支付交易日期 yyyyMMdd', placeholder: '20260829' },
        { key: 'org_req_seq_id', label: '原交易流水号 (org_req_seq_id)', required: false, requiredType: 'C', defaultValue: '', hint: '原支付流水号 (与原汇付流水二选一)', placeholder: 'REQ_JSPAY_...' },
        { key: 'org_hf_seq_id', label: '原汇付交易流水号 (org_hf_seq_id)', required: false, requiredType: 'C', defaultValue: '', hint: '原汇付全局交易流水号', placeholder: 'HF...' },
        { key: 'notify_url', label: '退款异步通知地址 (notify_url)', required: false, requiredType: 'N', defaultValue: '', hint: '退款结果回调URL', placeholder: 'https://...' },
        { key: 'remark', label: '退款原因/备注 (remark)', required: false, requiredType: 'N', defaultValue: '', hint: '退款说明', placeholder: '协商一致退款' },
      ],
    },
    {
      id: 'refund_query',
      category: 'payment_product',
      categoryLabel: '支付产品',
      label: '退款结果明细查询',
      api: 'v2/trade/payment/scanpay/refundquery',
      ep: '/api/huifu/trade/refundquery',
      method: 'POST',
      desc: '查询退款申请的处理进度与银行/渠道退款入账状态',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '6666000109133323', hint: '商户汇付ID', placeholder: '6666000109133323' },
        { key: 'org_req_date', label: '原退款请求日期 (org_req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '原退款申请日期 yyyyMMdd (默认当日)', placeholder: '20260829' },
        { key: 'org_req_seq_id', label: '原退款请求流水号 (org_req_seq_id)', required: false, requiredType: 'C', defaultValue: '', hint: '原退款申请流水号 (与原汇付退款流水二选一)', placeholder: 'REQ_REFUND_...' },
        { key: 'org_hf_seq_id', label: '原汇付退款流水号 (org_hf_seq_id)', required: false, requiredType: 'C', defaultValue: '', hint: '汇付全局退款流水号', placeholder: 'HF...' },
        { key: 'mer_ord_id', label: '原商户退款单号 (mer_ord_id)', required: false, requiredType: 'N', defaultValue: '', hint: '商户系统退款订单号', placeholder: 'REFORD...' },
      ],
    },
  ];// ================= 4. 分账服务 (4 接口，按官方规范 1:1 顺序排列) =================
  const splitMenus: ApiMenuItem[] = [
    {
      id: 'delay_confirm',
      category: 'split_service',
      categoryLabel: '分账服务',
      label: '交易确认',
      api: 'v2/trade/payment/delaytrans/confirm',
      ep: '/api/huifu/delaytrans/confirm',
      method: 'POST',
      desc: '对担保支付/预授权交易执行后期资金确认分账或全额解冻结算',
      fields: [
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd', placeholder: '20260829' },
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '本次确认唯一流水号', placeholder: 'CONF...' },
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '交易收款商户号', placeholder: '6666...' },
        { key: 'org_req_date', label: '原交易请求日期 (org_req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '原支付交易日期', placeholder: '20260829' },
        { key: 'org_req_seq_id', label: '原交易流水号 (org_req_seq_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '原支付请求流水号', placeholder: 'JS...' },
        { key: 'confirm_amt', label: '确认结算金额 (元) (confirm_amt)', required: true, requiredType: 'Y', defaultValue: '', hint: '本次解冻并确认结算的金额', placeholder: '0.01' },
        {
          key: 'acct_split_bunch',
          label: '分账接收方配置 (acct_split_bunch)',
          required: false,
          requiredType: 'N',
          type: 'array',
          hint: '多方分账明细列表',
          defaultValue: [
            { huifu_id: '6666000109819999', split_amt: '0.01' },
          ],
          subFields: [
            { key: 'huifu_id', label: '分账接收方商户号', required: true, requiredType: 'Y', placeholder: '6666...' },
            { key: 'split_amt', label: '分账金额 (元)', required: true, requiredType: 'Y', placeholder: '0.01' },
          ],
        },
      ],
    },
    {
      id: 'delay_confirm_query',
      category: 'split_service',
      categoryLabel: '分账服务',
      label: '交易确认查询',
      api: 'v2/trade/payment/delaytrans/confirm/query',
      ep: '/api/huifu/delaytrans/confirm/query',
      method: 'POST',
      desc: '查询延时交易确认指令的执行状态及分账明细',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户汇付ID', placeholder: '6666...' },
        { key: 'org_req_date', label: '原确认请求日期 (org_req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '确认指令提交日期', placeholder: '20260829' },
        { key: 'org_req_seq_id', label: '原确认请求流水号 (org_req_seq_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '确认指令提交流水号', placeholder: 'CONF...' },
      ],
    },
    {
      id: 'delay_refund',
      category: 'split_service',
      categoryLabel: '分账服务',
      label: '交易确认退款',
      api: 'v2/trade/payment/delaytrans/confirm/refund',
      ep: '/api/huifu/delaytrans/confirm/refund',
      method: 'POST',
      desc: '针对已完成交易确认的资金发起追溯退款',
      fields: [
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd', placeholder: '20260829' },
        { key: 'req_seq_id', label: '退款请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '确认退款唯一流水号', placeholder: 'DREF...' },
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户汇付ID', placeholder: '6666...' },
        { key: 'org_req_date', label: '原确认交易日期 (org_req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '原确认交易日期', placeholder: '20260829' },
        { key: 'org_req_seq_id', label: '原确认流水号 (org_req_seq_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '原确认请求流水号', placeholder: 'CONF...' },
        { key: 'refund_amt', label: '退款金额 (元) (refund_amt)', required: true, requiredType: 'Y', defaultValue: '', hint: '追溯退款金额 (元)', placeholder: '0.01' },
      ],
    },
    {
      id: 'delay_refund_query',
      category: 'split_service',
      categoryLabel: '分账服务',
      label: '交易确认退款查询',
      api: 'v2/trade/payment/delaytrans/confirm/refund/query',
      ep: '/api/huifu/delaytrans/confirm/refund/query',
      method: 'POST',
      desc: '查询延时交易确认退款指令的处理结果',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户汇付ID', placeholder: '6666...' },
        { key: 'org_req_date', label: '原退款请求日期 (org_req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '原确认退款日期', placeholder: '20260829' },
        { key: 'org_req_seq_id', label: '原退款流水号 (org_req_seq_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '原确认退款流水号', placeholder: 'DREF...' },
      ],
    },
  ];

  // ================= 5. 结算出金 (8 接口，按官方规范 1:1 顺序排列) =================
  const payoutMenus: ApiMenuItem[] = [
    {
      id: 'encash',
      category: 'payout_service',
      categoryLabel: '结算出金',
      label: '主动取现',
      api: 'v2/trade/settlement/encash',
      ep: '/api/huifu/settlement/encash',
      method: 'POST',
      desc: '商户主动将账户内可用余额提现至绑定的结算银行账户',
      fields: [
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd', placeholder: '20260829' },
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '取现唯一流水号', placeholder: 'CASH...' },
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '出金商户号', placeholder: '6666...' },
        { key: 'cash_amt', label: '取现金额 (元) (cash_amt)', required: true, requiredType: 'Y', defaultValue: '', hint: '单笔提现金额 (元)', placeholder: '100.00' },
        { key: 'cash_type', label: '取现到账时效 (cash_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: 'T1', label: 'T1 - 工作日到账' }, { value: 'D0', label: 'D0 - 当日到账' }, { value: 'D1', label: 'D1 - 自然日到账' }] },
        { key: 'into_acct_date', label: '指定到账日期 (into_acct_date)', required: false, requiredType: 'N', defaultValue: '', hint: '选填，yyyyMMdd', placeholder: '20260830' },
      ],
    },
    {
      id: 'transfer',
      category: 'payout_service',
      categoryLabel: '结算出金',
      label: '资金代发',
      api: 'v2/trade/settlement/transfer',
      ep: '/api/huifu/settlement/transfer',
      method: 'POST',
      desc: '商户向平台名下其他商户或个人用户执行批量/单笔资金代发',
      fields: [
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd', placeholder: '20260829' },
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '代发唯一流水号', placeholder: 'TRANS...' },
        { key: 'out_huifu_id', label: '出资商户号 (out_huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '资金扣减方商户号', placeholder: '6666...' },
        { key: 'in_huifu_id', label: '收款用户/商户号 (in_huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '资金接收方ID', placeholder: '6666...' },
        { key: 'trans_amt', label: '代发金额 (元) (trans_amt)', required: true, requiredType: 'Y', defaultValue: '', hint: '代发金额 (元)', placeholder: '10.00' },
        { key: 'transfer_type', label: '代发业务类型 (transfer_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '01', label: '01 - 佣金结算代发' }, { value: '02', label: '02 - 采购货款代发' }, { value: '03', label: '03 - 平台补贴' }] },
      ],
    },
    {
      id: 'encash_query',
      category: 'payout_service',
      categoryLabel: '结算出金',
      label: '取现&代发查询',
      api: 'v2/trade/settlement/encash/query',
      ep: '/api/huifu/settlement/encash/query',
      method: 'POST',
      desc: '查询单笔取现或代发指令的银行清算与打款状态',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '出资商户号', placeholder: '6666...' },
        { key: 'org_req_date', label: '原指令日期 (org_req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '发起取现/代发的日期', placeholder: '20260829' },
        { key: 'org_req_seq_id', label: '原指令流水号 (org_req_seq_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '发起时的请求流水号', placeholder: 'CASH...' },
      ],
    },
    {
      id: 'batch_query',
      category: 'payout_service',
      categoryLabel: '结算出金',
      label: '批量取现&代发查询',
      api: 'v2/trade/settlement/batch/query',
      ep: '/api/huifu/settlement/batch/query',
      method: 'POST',
      desc: '按批次号批量查询代发任务的汇总与成功/失败明细',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户汇付ID', placeholder: '6666...' },
        { key: 'batch_no', label: '批次号 (batch_no)', required: true, requiredType: 'Y', defaultValue: '', hint: '批量代发提交时的批次流水号', placeholder: 'BATCH...' },
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd', placeholder: '20260829' },
      ],
    },
    {
      id: 'settle_query',
      category: 'payout_service',
      categoryLabel: '结算出金',
      label: '结算对账查询',
      api: 'v2/trade/settlement/query',
      ep: '/api/huifu/settlement/query',
      method: 'POST',
      desc: '查询指定时间范围内的结算对账汇总与资金入账明细',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户汇付ID', placeholder: '6666...' },
        { key: 'begin_date', label: '起始日期 (begin_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd', placeholder: '20260801' },
        { key: 'end_date', label: '截止日期 (end_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd', placeholder: '20260829' },
        { key: 'page_num', label: '页码 (page_num)', required: true, requiredType: 'Y', defaultValue: '', hint: '从 1 开始', placeholder: '1' },
        { key: 'page_size', label: '每页条数 (page_size)', required: true, requiredType: 'Y', defaultValue: '', hint: '默认20', placeholder: '20' },
      ],
    },
    {
      id: 'quota_query',
      category: 'payout_service',
      categoryLabel: '结算出金',
      label: 'DM取现额度查询',
      api: 'v2/trade/settlement/quota/query',
      ep: '/api/huifu/settlement/quota/query',
      method: 'POST',
      desc: '查询商户 D0/T0 垫资授信及当日剩余可用取现额度',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户汇付ID', placeholder: '6666...' },
        { key: 'query_type', label: '额度类型 (query_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '01', label: '01 - D0/T0 实时取现授信额度' }, { value: '02', label: '02 - 垫资代发可用额度' }] },
      ],
    },
    {
      id: 'fee_calc',
      category: 'payout_service',
      categoryLabel: '结算出金',
      label: '手续费试算',
      api: 'v2/trade/settlement/fee/calculate',
      ep: '/api/huifu/settlement/fee/calculate',
      method: 'POST',
      desc: '在实际出金前提早试算需扣除的手续费与实到金额',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户汇付ID', placeholder: '6666...' },
        { key: 'trans_amt', label: '拟取现/代发金额 (trans_amt)', required: true, requiredType: 'Y', defaultValue: '', hint: '金额 (元)', placeholder: '1000.00' },
        { key: 'calc_type', label: '业务场景 (calc_type)', required: true, requiredType: 'Y', type: 'select', defaultValue: '', options: [{ value: '01', label: '01 - 账户余额取现' }, { value: '02', label: '02 - 资金代发' }] },
      ],
    },
    {
      id: 'remit_confirm',
      category: 'payout_service',
      categoryLabel: '结算出金',
      label: '对公打款验证确认',
      api: 'v2/merchant/busi/remit/confirm',
      ep: '/api/huifu/merchant/remit/confirm',
      method: 'POST',
      desc: '企业进件小额打款核验，输入收到的小额验证资金完成认证',
      fields: [
        { key: 'huifu_id', label: '商户号 (huifu_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '商户汇付ID', placeholder: '6666...' },
        { key: 'apply_id', label: '申请单号 (apply_id)', required: true, requiredType: 'Y', defaultValue: '', hint: '进件申请单流水号', placeholder: 'APPLY...' },
        { key: 'remit_amt', label: '打款金额 (元) (remit_amt)', required: true, requiredType: 'Y', defaultValue: '', hint: '银行账户收到的精确验证金额 (如 0.18)', placeholder: '0.18' },
        { key: 'req_date', label: '请求日期 (req_date)', required: true, requiredType: 'Y', defaultValue: '', hint: '格式：yyyyMMdd', placeholder: '20260829' },
        { key: 'req_seq_id', label: '请求流水号 (req_seq_id)', required: true, requiredType: 'Y', defaultValue: '' + Date.now().toString().slice(-9), hint: '请求流水号', placeholder: 'REMIT...' },
      ],
    },
  ];

  const categoryGroups: CategoryGroup[] = useMemo(() => [
    { key: 'merchant_onboarding', title: '商户进件', icon: Building2,
  Layers,
  Workflow,
  Zap, items: merchantOnboardingMenus },
    { key: 'user_onboarding', title: '用户进件', icon: Users, items: userOnboardingMenus },
    { key: 'payment_product', title: '支付产品', icon: CreditCard, items: paymentMenus },
    { key: 'split_service', title: '分账服务', icon: PieChart, items: splitMenus },
    { key: 'payout_service', title: '结算出金', icon: Banknote, items: payoutMenus },
  ], []);

  const allMenuList = useMemo(() => {
    return [
      ...merchantOnboardingMenus,
      ...userOnboardingMenus,
      ...paymentMenus,
      ...splitMenus,
      ...payoutMenus,
    ];
  }, []);

  const filteredMenuList = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    return allMenuList.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.api.toLowerCase().includes(q) ||
        (m.desc && m.desc.toLowerCase().includes(q))
    );
  }, [allMenuList, searchQuery]);

  const currentMenu = useMemo(() => {
    return allMenuList.find((m) => m.id === activeMenu) || merchantOnboardingMenus[0];
  }, [allMenuList, activeMenu]);

  // Helper to generate current date YYYYMMDD
  const getTodayDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  };

  // Helper to generate unique request sequence ID: REQ_{API_ID}_{TIMESTAMP}
  const generateReqSeqId = (menuId: string) => {
    const prefix = menuId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `REQ_${prefix}_${y}${m}${d}${hh}${mm}${ss}${ms}`;
  };

  // Intelligent initialization on menu switch: auto-fills req_date and req_seq_id, all other fields clean
  useEffect(() => {
    const initData: Record<string, any> = {};
    currentMenu.fields.forEach((f) => {
      if (f.key === 'req_date') {
        initData[f.key] = getTodayDate();
      } else if (f.key === 'req_seq_id') {
        initData[f.key] = generateReqSeqId(currentMenu.id);
      } else if (f.key === 'huifu_id' || f.key === 'sys_id') {
        initData[f.key] = activeConfig?.sysId || '6666000109133323';
      } else if (f.key === 'upper_huifu_id') {
        initData[f.key] = '6666000108840829';
      } else if (f.type === 'array') {
        initData[f.key] = [];
      } else if (f.type === 'object') {
        initData[f.key] = {};
      } else {
        initData[f.key] = '';
      }
    });
    setFormData(initData);
    setApiResponse(null);
  }, [currentMenu, activeConfig]);

  // Handle primitive field changes
  const handleFieldChange = (key: string, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  // Handle nested object subfield changes
  const handleObjectFieldChange = (parentKey: string, subKey: string, val: any) => {
    setFormData((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] || {}),
        [subKey]: val,
      },
    }));
  };

  // Handle array item subfield changes
  const handleArrayItemChange = (arrayKey: string, index: number, subKey: string, val: any) => {
    setFormData((prev) => {
      const arr = Array.isArray(prev[arrayKey]) ? [...prev[arrayKey]] : [];
      arr[index] = { ...(arr[index] || {}), [subKey]: val };
      return { ...prev, [arrayKey]: arr };
    });
  };

  // Add new item to an array field
  const handleAddArrayItem = (field: FormFieldDef) => {
    const newItem: Record<string, any> = {};
    field.subFields?.forEach((sf) => {
      newItem[sf.key] = sf.defaultValue || '';
    });
    setFormData((prev) => {
      const currentList = Array.isArray(prev[field.key]) ? prev[field.key] : [];
      return { ...prev, [field.key]: [...currentList, newItem] };
    });
  };

  // Remove an item from an array field
  const handleRemoveArrayItem = (arrayKey: string, index: number) => {
    setFormData((prev) => {
      const arr = Array.isArray(prev[arrayKey]) ? [...prev[arrayKey]] : [];
      arr.splice(index, 1);
      return { ...prev, [arrayKey]: arr };
    });
  };

  const handleFillDemo = () => {
    const demoData: Record<string, any> = {};
    currentMenu.fields.forEach((f) => {
      if (f.defaultValue !== undefined) {
        demoData[f.key] = JSON.parse(JSON.stringify(f.defaultValue));
      } else if (f.type === 'array') {
        demoData[f.key] = [];
      } else if (f.type === 'object') {
        demoData[f.key] = {};
      } else {
        demoData[f.key] = '';
      }
    });
    setFormData(demoData);
  };

  const handleClearForm = () => {
    const emptyData: Record<string, any> = {};
    currentMenu.fields.forEach((f) => {
      if (f.type === 'array') emptyData[f.key] = [];
      else if (f.type === 'object') emptyData[f.key] = {};
      else emptyData[f.key] = '';
    });
    setFormData(emptyData);
  };

  // Serialize payload for Huifu API: objects & arrays are serialized to JSON strings
  const serializePayload = useMemo(() => {
    const payload: Record<string, any> = {};
    currentMenu.fields.forEach((f) => {
      const val = formData[f.key];
      if (f.type === 'object') {
        payload[f.key] = val && Object.keys(val).length > 0 ? JSON.stringify(val) : '';
      } else if (f.type === 'array') {
        payload[f.key] = Array.isArray(val) && val.length > 0 ? JSON.stringify(val) : '';
      } else {
        payload[f.key] = val !== undefined ? String(val) : '';
      }
    });
    return payload;
  }, [currentMenu, formData]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('task_sidebar_collapsed', String(next));
      return next;
    });
  };

  const fetchConfigs = async () => {
    try {
      const res = await axios.get('/api/huifu/configs');
      const list: MerchantConfig[] = res.data.data || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setConfigList(list);
        localStorage.setItem('task_merchant_configs_cache', JSON.stringify(list));
        setActiveConfig((prev) => {
          if (prev && list.some((c) => c.id === prev.id)) {
            return list.find((c) => c.id === prev.id)!;
          }
          const defaultOne = list.find((c) => c.isDefault);
          return defaultOne || list[0];
        });
        return;
      }
    } catch (e) {
      console.warn('Failed to load configs from backend API, checking local storage cache...', e);
    }

    try {
      const cached = localStorage.getItem('task_merchant_configs_cache');
      if (cached) {
        const parsed: MerchantConfig[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConfigList(parsed);
          setActiveConfig(parsed.find((c) => c.isDefault) || parsed[0]);
          return;
        }
      }
    } catch {}

    const defaultMaster: MerchantConfig[] = [
      {
        id: 1,
        configName: '汇付斗拱-正式生产商户',
        sysId: '6666000109133323',
        productId: 'YYZY',
        rsaHuifuPublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAml2x/5zAG/XLYS4i3u4pLlbDlMRFxwLh0QACGVNJYf9iFy7HFAQbqNfYzCXBMrgizbmJ12GHxlVjMB9l2T92USqIuEfqI2ONQ4A6iYTIw+UAq+QcHEgMuLOECgK5YpiIaSMfTy5fbxo6HikoYcVfslrZQyy/kMtbyBDnMoFqqyYDHYC4mZH0cwcvahAdWDiAuHppCOiXOmXnZCnK62veoRAzwZ1y0xhNPg6GZDDYmmPocw60WhmUWPS5cq3GgHe56UB91JCYr9hjTU2ZFXMYwp5unu2t/6H5KQA8MLrzEZ7wCQxTluS6G0aVffnlBxKyt2qwMEsOjDJ+Ib9Ripo7PQIDAQAB',
        rsaMerchPrivateKey: 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCJvVbSHB3Ezo/2tqkKd6F6gJNIbYyoGczfMtC5G8SmO0Y+97non7tvQDCe0MoZPXku6HyBdFdiUo0lg2ouPKXmLkRFXJMQAYwTXpMXktcV2KloYamDPj9MTcwv6UXKlqkj/GpK05QTPRhnRlEvtc0vt4zZuNuhSzolPDf1zXQVCaO3I1ZdkzRDgoAZlDBqWXbsJa9aUbBebKYzF0jSf7Qv1CoZY7Zr6fsQ6xQRCGBvVPbK/kkw/pUPos0blcXQwu9PfdrukP9ZBpH1XZVeI32ZcFOp/k4W1zrRZaBsJiYGzuZe5NBm0pHGT33mQVnPAkwXFtT3JJ85HMv41yGYbUcJAgMBAAECggEANa+ez3Y2BCee5UJ80J+gSOckgO5yDHNB7x0XTY8NLt2bm59iztCzdcFHMh+fJgdX3HixTqPSC3ixmxWFpU/uObF+2qoih/KSblpGasHJI7K3FQA72fPBKDSKiYIaucPPWT9hDpk49eayRE6cBkSOHTMlqxbqRAvWNf0qspvJywjMbEWca+kMckSqIGnOCWnk9CXK3tncxR2lU74/shDO2jhS+LexPAGqtrXRRVjKQ4fbYCnoK3hyvtSB/R7bxpJ4mrHvvlDQWoP23wDsOGusFRSTU4gPrvzAijaet9go/nzOxa3Okucxq3YQcNWToaC2GzSwPsxb7u/ep6W4f8ZSgQKBgQC9A3MrXWA8Gy6f7BHUPRXL9zUB/vQhKymsflcT3DRaqvhT5isJJFAR/unSD7/y62XQyEW0yIwb5zkeKApO0lUkom5ogCAcOXLFdksG2gMG8sa5CZk53y5papd+vmmbRvs0F7h2QWUe8L46TQ5jWejbE13ug0Knmem7PhPdMZhjNQKBgQC6jfw/WZ64tJ+Y7l8tuRdEWhgNmdrWU3fJWKxzA8I9lmzm8kCswvZJCVc0vo5swB/n9GWYSF7tqPEC4O+DxHrJ0o6UqezujhiOK5yqpOtsI/hVCII7CCaytGxjcBfF7qvgbyKHMplCOKq4gVOhKKYSXkrdcCYCQI3tnhinCuHbBQKBgFMz3pG7Q+6RhJ+vOlX0IdEsW/Ap++tR5cFhyBEdAQrccf30twMKMhkJ3oGynytexe33CwA+u7ZYvYLx2z/BROugePuVUw05mLUlkndMpsJ7QlEX0ZRxEywiWNfZGAHbaB8RRgkAVnQdQ4/Edc30ORWe291veHrwvLvI4tOezlb1AoGBAKka8dA/HdiSqqVHVvGseUHVZT5W+/8SNGBIyDGN87I+PENwz12LcRMtq2Y9Yf+EfKeXa8yJtbs7TBVu7s6D+UYfXm22RvbLych+EgrBakJhrMbv6pU2Q1X0pNfSkUozmovcUfE51aEomuCbIsLQhRHbdYObGGksOTtu9yvcenU9AoGAaPcSmyr7aF37SWiwQkqXzWLo8Fs/RHTr8MNWt/PUlvWCANnTnyGO4G8bpER9OWFfuhV+VscbcbbFS1UqId1L2HbkvpR/AMbr3GGnx5wVy8KNTmO92TbugJ4KfjhObPrUl216LRwInCnoCiqIwpsBjFfumNG1rkX94HPmmrD8jNY=',
        isProd: true,
        isDefault: true,
      },
    ];
    setConfigList(defaultMaster);
    setActiveConfig(defaultMaster[0]);
  };

  const handleOpenNewConfig = () => {
    setEditingConfigId(null);
    setConfigForm({
      configName: '',
      sysId: '',
      productId: 'YYZY',
      isProd: true,
      isDefault: false,
      rsaHuifuPublicKey: '',
      rsaMerchPrivateKey: '',
    });
    setIsConfigModalOpen(true);
  };

  const handleEditConfig = (cfg: MerchantConfig) => {
    setEditingConfigId(cfg.id || null);
    setConfigForm({
      configName: cfg.configName || '',
      sysId: cfg.sysId || '',
      productId: cfg.productId || 'YYZY',
      isProd: cfg.isProd ?? true,
      isDefault: cfg.isDefault ?? false,
      rsaHuifuPublicKey: cfg.rsaHuifuPublicKey || (cfg as any).rsaPublicKey || '',
      rsaMerchPrivateKey: cfg.rsaMerchPrivateKey || (cfg as any).rsaPrivateKey || '',
    });
    setIsConfigModalOpen(true);
  };

  const handleSaveConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigSuccessMsg('');
    try {
      const payload = {
        ...(editingConfigId ? { id: editingConfigId } : {}),
        configName: configForm.configName.trim(),
        sysId: configForm.sysId.trim(),
        productId: configForm.productId.trim(),
        isProd: configForm.isProd,
        isDefault: configForm.isDefault,
        rsaHuifuPublicKey: configForm.rsaHuifuPublicKey.trim(),
        rsaMerchPrivateKey: configForm.rsaMerchPrivateKey.trim(),
      };
      await axios.post('/api/huifu/config', payload);
      setConfigSuccessMsg(editingConfigId ? '商户配置已成功更新！' : '新商户配置已成功添加入库！');
      await fetchConfigs();
      setTimeout(() => {
        setIsConfigModalOpen(false);
        setConfigSuccessMsg('');
      }, 800);
    } catch (err: any) {
      alert('保存商户配置失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setConfigSaving(false);
    }
  };

  const handleDeleteConfig = async (id: number) => {
    if (!window.confirm('确定要删除此商户配置吗？')) return;
    try {
      await axios.delete(`/api/huifu/config/${id}`);
      await fetchConfigs();
    } catch (err: any) {
      alert('删除失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSetDefaultConfig = async (id: number) => {
    try {
      await axios.post(`/api/huifu/config/${id}/default`);
      await fetchConfigs();
    } catch (err: any) {
      alert('设为默认商户失败: ' + (err.response?.data?.message || err.message));
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/huifu/logs');
      setLogs(res.data.data || res.data || []);
    } catch {
      setLogs([]);
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchLogs();
  }, []);

  const handleApiCall = async (endpoint: string) => {
    setLoading(true);
    setApiResponse(null);
    try {
      const requestPayload = {
        ...serializePayload,
        config_id: activeConfig?.id,
      };
      const res = await axios.post(endpoint, requestPayload);
      setApiResponse(res.data);
      fetchLogs();
    } catch (e: any) {
      setApiResponse(e.response?.data || { error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`https://api.huifu.com/${currentMenu.api}`);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1500);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(serializePayload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1500);
  };

  const handleCopyResponse = () => {
    if (!apiResponse) return;
    navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
    setCopiedRes(true);
    setTimeout(() => setCopiedRes(false), 1500);
  };

  return (
    <div className="task-console min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="task-topbar h-14 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shrink-0 shadow-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              title={sidebarCollapsed ? '展开菜单栏' : '收起菜单栏'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-blue-600" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <div className="task-wordmark flex items-center gap-2.5">
              <div className="task-brand-mark w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-600/25 border border-blue-500/30 flex items-center justify-center text-blue-600 font-bold shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="task-eyebrow">PAYMENT OPERATIONS / WORKFLOW</div>
                <div className="flex items-center gap-2">
                  <h1 className="task-title text-sm font-bold text-slate-900 tracking-tight">Task Flow</h1>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200 font-mono">OPS</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Merchant Selector and Management */}
          <div className="task-merchant-tools flex items-center gap-2">
            <div className="task-merchant-select flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-500 text-[11px] whitespace-nowrap">当前调测商户:</span>
              <select
                value={activeConfig?.id || ''}
                onChange={(e) => {
                  const found = configList.find((c) => c.id === Number(e.target.value));
                  if (found) setActiveConfig(found);
                }}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs max-w-[280px] truncate"
              >
                {configList.map((c) => (
                  <option key={c.id || c.sysId} value={c.id} className="bg-white text-slate-800">
                    {c.configName} ({c.sysId}) {c.isProd ? '[生产环境]' : '[沙箱环境]'}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingConfigId(null);
                setIsConfigModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition cursor-pointer"
              title="商户账号与私钥配置管理"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">商户管理</span>
            </button>
          </div>

          <a
            href="http://localhost:3100"
            target="_blank"
            rel="noreferrer"
            className="task-platform-link flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Platform (3100)</span>
          </a>
        </div>
      </header>

      {/* Main Container */}
      <div className="task-workspace flex-1 flex w-full p-3 md:p-4 gap-4 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`task-directory border border-slate-200 bg-white rounded-xl py-3 flex flex-col justify-between transition-all duration-200 shrink-0 select-none shadow-xs overflow-hidden ${
            sidebarCollapsed ? 'w-16 px-1.5 items-center' : 'w-72 px-2'
          }`}
        >
          {sidebarCollapsed ? (
            /* Collapsed Mode: Clean Module Icons with Hover Flyout Tooltips */
            <div className="flex-1 flex flex-col items-center gap-3 w-full py-1">
              {categoryGroups.map((group) => {
                const Icon = group.icon;
                const isGroupActive = activeCategory === group.key;
                return (
                  <div key={group.key} className="relative group/pop">
                    <button
                      onClick={() => selectMenu(group.key, group.items[0].id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${
                        isGroupActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title={group.title}
                    >
                      <Icon className="w-5 h-5" />
                    </button>

                    {/* Flyout Menu on Hover */}
                    <div className="absolute left-full top-0 ml-2.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-2 hidden group-hover/pop:block z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1 mb-1 border-b border-slate-100 flex items-center justify-between">
                        <span>{group.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{group.items.length}</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto space-y-0.5">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => selectMenu(group.key, item.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                              activeMenu === item.id
                                ? 'bg-blue-50 text-blue-600 font-bold'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{item.label}</span>
                            <span className="text-[9px] font-mono text-slate-400">POST</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}


            </div>
          ) : (
            /* Expanded Mode: Full Tree Navigation */
            <div className="flex-1 flex flex-col overflow-hidden w-full">
              <div className="px-1 mb-3">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="输入您的问题或搜索接口..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto pr-1">
                {filteredMenuList ? (
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-blue-600 px-2 py-1 flex items-center justify-between">
                      <span>搜索匹配 ({filteredMenuList.length})</span>
                    </div>
                    {filteredMenuList.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">未找到匹配接口</div>
                    ) : (
                      filteredMenuList.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => selectMenu(item.category, item.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                            activeMenu === item.id
                              ? 'bg-blue-50 text-blue-600 font-semibold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </div>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                            {item.categoryLabel}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  categoryGroups.map((group) => {
                    const isOpen = openSections[group.key] ?? false;
                    return (
                      <div key={group.key} className="space-y-0.5 pt-1">
                        <button
                          onClick={() => toggleSection(group.key)}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            {isOpen ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span>{group.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">{group.items.length}</span>
                        </button>

                        {isOpen &&
                          group.items.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => selectMenu(group.key, item.id)}
                              className={`w-full flex items-center justify-between pl-6 pr-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                                activeCategory === group.key && activeMenu === item.id
                                  ? 'bg-blue-50 text-blue-600 font-bold'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal'
                              }`}
                            >
                              <span className="truncate">{item.label}</span>
                              {activeCategory === group.key && activeMenu === item.id && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                              )}
                            </button>
                          ))}
                      </div>
                    );
                  })
                )}


              </div>
            </div>
          )}

          {/* Bottom Toggle Button */}
          <div className="pt-2 border-t border-slate-100 space-y-1 w-full">
            <button
              onClick={toggleSidebar}
              className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs transition cursor-pointer ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title={sidebarCollapsed ? '展开目录导航' : '收起目录导航'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-blue-600" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-slate-500" />
                  <span className="text-[11px]">收起目录导航</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="task-main flex-1 min-w-0 overflow-y-auto space-y-4 pr-1 pb-24">
          {/* Official API Header Card */}
          <div className="doc-card p-5 rounded-xl bg-white space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{currentMenu.label}</h2>
                <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#fa8c16] text-white">
                    {currentMenu.method}
                  </span>
                  <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 select-all">
                    https://api.huifu.com/{currentMenu.api}
                  </span>
                  <button
                    onClick={handleCopyUrl}
                    className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title="复制完整接口地址"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                  title="查看历史请求与响应"
                >
                  <History className="w-3.5 h-3.5 text-slate-600" />
                  <span>历史履历 ({historyList.length})</span>
                </button>
                <button
                  onClick={handleClearForm}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-600 hover:bg-slate-100 text-xs font-medium border border-slate-300 transition cursor-pointer"
                  title="重置清空表单"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>重置</span>
                </button>
              </div>
            </div>

            {currentMenu.desc && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
                <div className="font-semibold text-slate-800 mb-0.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>应用场景说明</span>
                </div>
                <p>{currentMenu.desc}</p>
              </div>
            )}
          </div>

          {/* Form Content: Flat sequential order strictly matching official documentation table */}
          <div className="doc-card p-5 rounded-xl bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">请求业务参数 (data)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  严格对齐开放平台官方文档表格原始顺序排列展示，支持必填/选填标示与结构化录入
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 font-medium text-[11px]">
                  * 必填 (Y)
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium text-[11px]">
                  条件必填 (C)
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium text-[11px]">
                  非必填 (N)
                </span>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {currentMenu.fields.map((field, idx) => {
                const val = formData[field.key];
                const isComplexArray = field.type === 'array';
                const isComplexObject = field.type === 'object';

                // 1. Array Field (Dynamic items list)
                if (isComplexArray) {
                  const items: Record<string, any>[] = Array.isArray(val) ? val : [];
                  return (
                    <div
                      key={field.key}
                      className="col-span-1 md:col-span-2 lg:col-span-3 bg-blue-50/40 p-4 rounded-xl border border-blue-200/80 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-600 w-5">{idx + 1}.</span>
                          <span className="text-slate-900 font-bold text-sm">{field.label}</span>
                          <span className="text-[11px] font-mono text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-300/60">
                            JSON Array ({items.length} 项)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {field.requiredType === 'Y' ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200 font-semibold">
                              * 必填
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                              选填
                            </span>
                          )}
                          <button
                            onClick={() => handleAddArrayItem(field)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>添加一项</span>
                          </button>
                        </div>
                      </div>

                      {field.hint && <p className="text-[11px] text-slate-500 leading-normal">{field.hint}</p>}

                      {items.length === 0 ? (
                        <div className="text-center py-4 bg-white/80 rounded-lg border border-dashed border-slate-300 text-slate-400 text-xs">
                          暂无配置项，点击右上角「+ 添加一项」扩展配置
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {items.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs space-y-3 relative group"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                                    {itemIdx + 1}
                                  </span>
                                  <span>{field.label.split(' ')[0]} 项 #{itemIdx + 1}</span>
                                </span>
                                <button
                                  onClick={() => handleRemoveArrayItem(field.key, itemIdx)}
                                  className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                                  title="删除此项"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                {field.subFields?.map((sf) => {
                                  const subVal = item[sf.key] ?? '';
                                  return (
                                    <div key={sf.key} className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-medium text-slate-700 truncate">
                                          {sf.label}
                                        </label>
                                        {sf.requiredType === 'Y' && (
                                          <span className="text-rose-500 font-bold text-[10px]">*</span>
                                        )}
                                      </div>
                                      {sf.type === 'select' ? (
                                        <select
                                          value={subVal}
                                          onChange={(e) =>
                                            handleArrayItemChange(field.key, itemIdx, sf.key, e.target.value)
                                          }
                                          className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded p-1.5 text-xs text-slate-800 focus:outline-none transition cursor-pointer"
                                        >
                                          {sf.options?.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                              {opt.label}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          value={subVal}
                                          onChange={(e) =>
                                            handleArrayItemChange(field.key, itemIdx, sf.key, e.target.value)
                                          }
                                          placeholder={sf.placeholder || ''}
                                          className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded p-1.5 text-xs text-slate-800 focus:outline-none transition"
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // 2. Object Field (Nested structured form card)
                if (isComplexObject) {
                  const objVal: Record<string, any> = val && typeof val === 'object' ? val : {};
                  return (
                    <div
                      key={field.key}
                      className="col-span-1 md:col-span-2 lg:col-span-3 bg-slate-50/90 p-4 rounded-xl border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-500 w-5">{idx + 1}.</span>
                          <span className="text-slate-900 font-bold text-sm">{field.label}</span>
                          <span className="text-[11px] font-mono text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">
                            JSON Object (结构化表单)
                          </span>
                        </div>
                        {field.requiredType === 'Y' ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200 font-semibold">
                            * 必填
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                            选填
                          </span>
                        )}
                      </div>

                      {field.hint && <p className="text-[11px] text-slate-500 leading-normal">{field.hint}</p>}

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                        {field.subFields?.map((sf) => {
                          const subVal = objVal[sf.key] ?? '';
                          return (
                            <div key={sf.key} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-medium text-slate-700 truncate">
                                  {sf.label}
                                </label>
                                {sf.requiredType === 'Y' && (
                                  <span className="text-rose-500 font-bold text-[10px]">*</span>
                                )}
                              </div>
                              {sf.type === 'select' ? (
                                <select
                                  value={subVal}
                                  onChange={(e) => handleObjectFieldChange(field.key, sf.key, e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded p-1.5 text-xs text-slate-800 focus:outline-none transition cursor-pointer"
                                >
                                  {sf.options?.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  value={subVal}
                                  onChange={(e) => handleObjectFieldChange(field.key, sf.key, e.target.value)}
                                  placeholder={sf.placeholder || ''}
                                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded p-1.5 text-xs text-slate-800 focus:outline-none transition"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // 3. Normal Primitive Field
                return (
                  <div
                    key={field.key}
                    className="space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[11px] font-mono text-slate-400 font-medium w-4">{idx + 1}.</span>
                        <label className="text-slate-800 font-semibold truncate text-xs" title={field.label}>
                          {field.label}
                        </label>
                      </div>

                      {field.requiredType === 'Y' || field.required === true ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200 font-semibold shrink-0">
                          * 必填
                        </span>
                      ) : field.requiredType === 'C' ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium shrink-0">
                          条件必填
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                          选填
                        </span>
                      )}
                    </div>

                    {field.type === 'select' ? (
                      <select
                        value={val ?? ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg p-2 text-slate-800 font-medium focus:outline-none cursor-pointer text-xs transition"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={val ?? ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder || field.hint || ''}
                        className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg p-2 text-slate-800 text-xs transition"
                      />
                    )}

                    {field.hint && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate pt-0.5" title={field.hint}>
                        <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{field.hint}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>


          {/* ================= Fixed Floating Action Dock (固定在视口底部右侧内容区，不随滚动跑掉，不遮挡侧边栏) ================= */}
          <div
            className={`fixed bottom-3 right-4 z-40 transition-all duration-200 ${
              sidebarCollapsed ? 'left-20' : 'left-[17rem]'
            }`}
          >
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-2xl px-5 py-2.5 flex items-center justify-between gap-3">
              {/* Left: Active Interface Info */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-slate-900 text-xs truncate">
                    {currentMenu.label}
                  </span>
                  <span className="hidden md:inline-block font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {currentMenu.api}
                  </span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                  title="查看调用历史记录"
                >
                  <History className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">调用历史</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px]">
                    {historyList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleClearForm}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium border border-slate-200 transition cursor-pointer"
                  title="清空表单所有字段"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">重置</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApiCall(currentMenu.ep)}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? '正在执行提交...' : `立即提交 (${currentMenu.label})`}</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>


      {/* ================= 1. Execution Result Modal (提交后弹出：执行内容、请求参数、响应结果) ================= */}
      {isResultModalOpen && lastExecution && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                    lastExecution.isSuccess ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}
                >
                  {lastExecution.isSuccess ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-slate-900">{lastExecution.apiName}</h3>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        lastExecution.isSuccess
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}
                    >
                      {lastExecution.isSuccess ? '调用成功 (00000000)' : `业务反馈 (${lastExecution.respCode})`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-3 flex-wrap">
                    <span className="text-blue-600 font-semibold">{lastExecution.apiPath}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      耗时: {lastExecution.durationMs} ms
                    </span>
                    <span>•</span>
                    <span>{lastExecution.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsResultModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Request & Response Side-by-Side */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Response Message Banner */}
              {lastExecution.respDesc && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
                    lastExecution.isSuccess
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-amber-600" />
                    <span><strong>汇付响应说明：</strong>{lastExecution.respDesc}</span>
                  </div>
                  {lastExecution.reqSeqId && (
                    <span className="font-mono text-[11px] opacity-80 shrink-0">
                      流水号: {lastExecution.reqSeqId}
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Request Data */}
                <div className="space-y-2 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Terminal className="w-4 h-4 text-blue-600" />
                      <span>本次提交请求参数 (Request Data)</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(lastExecution.requestPayload, null, 2));
                        setCopiedReqJson(true);
                        setTimeout(() => setCopiedReqJson(false), 2000);
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition"
                    >
                      {copiedReqJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReqJson ? '已复制请求' : '复制请求参数'}</span>
                    </button>
                  </div>
                  <pre className="flex-1 p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto max-h-[420px] leading-relaxed select-all">
                    {JSON.stringify(lastExecution.requestPayload, null, 2)}
                  </pre>
                </div>

                {/* Right Column: Response Data */}
                <div className="space-y-2 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <FileJson className="w-4 h-4 text-emerald-600" />
                      <span>汇付官方响应结果 (Response Result)</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(lastExecution.responseData, null, 2));
                        setCopiedRespJson(true);
                        setTimeout(() => setCopiedRespJson(false), 2000);
                      }}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
                    >
                      {copiedRespJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRespJson ? '已复制响应' : '复制响应结果'}</span>
                    </button>
                  </div>
                  <pre className="flex-1 p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-[420px] leading-relaxed select-all">
                    {JSON.stringify(lastExecution.responseData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-2xl">
              <button
                onClick={() => {
                  setIsResultModalOpen(false);
                  setIsHistoryModalOpen(true);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
              >
                <History className="w-4 h-4" />
                <span>查看全部历史调用记录 ({historyList.length})</span>
              </button>

              <button
                onClick={() => setIsResultModalOpen(false)}
                className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. Execution History Modal (历史调用履历弹窗) ================= */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">接口调用历史履历</h3>
                  <p className="text-xs text-slate-500">记录在此浏览器中发起的所有联调请求及响应报文</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {historyList.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('确定清空本地所有历史调用记录吗？')) {
                        setHistoryList([]);
                        localStorage.removeItem('task_exec_history');
                      }
                    }}
                    className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer font-medium"
                  >
                    清空历史
                  </button>
                )}
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Table Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {historyList.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <History className="w-8 h-8 text-slate-300" />
                  <p>暂无历史调用记录，点击底部的「立即提交」即可发起并沉淀调用履历</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 hover:bg-slate-50/80 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">{item.apiName}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                              item.isSuccess
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                          >
                            {item.respCode}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            耗时: {item.durationMs}ms
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-blue-600">{item.apiPath}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-600">流水号: {item.reqSeqId || '-'}</span>
                          <span>•</span>
                          <span className="text-slate-400">{item.timestamp}</span>
                        </div>
                        {item.respDesc && (
                          <div className="text-[11px] text-slate-600 truncate max-w-xl">
                            {item.respDesc}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setLastExecution(item);
                          setIsHistoryModalOpen(false);
                          setIsResultModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold border border-blue-200 transition cursor-pointer text-xs shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>查看报文详情</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end rounded-b-2xl">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merchant Management Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">联调商户账号与密钥配置</h3>
                  <p className="text-xs text-slate-500">配置各环境商户号、产品号与 RSA 签名密钥，多商户随时切换</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {configSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{configSuccessMsg}</span>
                </div>
              )}

              {/* Configured Merchant Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    已配置商户 ({configList.length})
                  </span>
                  <button
                    onClick={handleOpenNewConfig}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新建商户配置</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {configList.map((cfg) => {
                    const isActive = activeConfig?.id === cfg.id || (activeConfig?.sysId === cfg.sysId && !cfg.id);
                    return (
                      <div
                        key={cfg.id || cfg.sysId}
                        className={`p-3.5 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-400/30'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">{cfg.configName}</span>
                            {cfg.isDefault && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                默认
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                cfg.isProd
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {cfg.isProd ? '生产环境 (PROD)' : '沙箱环境 (TEST)'}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> 当前联调中
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-4 flex-wrap">
                            <span>系统商户号: <strong className="text-slate-700">{cfg.sysId}</strong></span>
                            <span>产品号: <strong className="text-slate-700">{cfg.productId || 'YYZY'}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                          {!isActive && (
                            <button
                              onClick={() => setActiveConfig(cfg)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100/70 rounded-lg transition cursor-pointer"
                            >
                              设为当前
                            </button>
                          )}
                          {cfg.id && !cfg.isDefault && (
                            <button
                              onClick={() => handleSetDefaultConfig(cfg.id!)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg transition cursor-pointer"
                            >
                              设为默认
                            </button>
                          )}
                          <button
                            onClick={() => handleEditConfig(cfg)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                            title="编辑配置"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {cfg.id && configList.length > 1 && (
                            <button
                              onClick={() => handleDeleteConfig(cfg.id!)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="删除配置"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add / Edit Form */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="text-xs font-bold text-slate-800">
                    {editingConfigId ? '编辑商户配置与私钥' : '新建商户配置入库'}
                  </span>
                  {editingConfigId && (
                    <button
                      onClick={handleOpenNewConfig}
                      className="text-xs text-blue-600 hover:underline cursor-pointer"
                    >
                      切换为新建
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveConfigSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">商户配置名称 *</label>
                      <input
                        type="text"
                        required
                        value={configForm.configName}
                        onChange={(e) => setConfigForm((prev) => ({ ...prev, configName: e.target.value }))}
                        placeholder="例如：汇付斗拱-正式生产商户"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">系统商户号 (sys_id) *</label>
                      <input
                        type="text"
                        required
                        value={configForm.sysId}
                        onChange={(e) => setConfigForm((prev) => ({ ...prev, sysId: e.target.value }))}
                        placeholder="例如：6666000109133323"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">产品号 (product_id) *</label>
                      <input
                        type="text"
                        required
                        value={configForm.productId}
                        onChange={(e) => setConfigForm((prev) => ({ ...prev, productId: e.target.value }))}
                        placeholder="例如：YYZY 或 100001"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">运行环境 (Environment) *</label>
                      <select
                        value={configForm.isProd ? 'prod' : 'test'}
                        onChange={(e) => setConfigForm((prev) => ({ ...prev, isProd: e.target.value === 'prod' }))}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="prod">生产环境 (https://api.huifu.com)</option>
                        <option value="test">沙箱测试环境 (https://mock.huifu.com)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">商户 RSA 私钥 (rsa_merch_private_key) *</label>
                    <textarea
                      rows={3}
                      required
                      value={configForm.rsaMerchPrivateKey}
                      onChange={(e) => setConfigForm((prev) => ({ ...prev, rsaMerchPrivateKey: e.target.value }))}
                      placeholder="粘贴商户开发者私钥字符串 (PKCS#8/PKCS#1 格式，MIIEvQIBAD...)"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-[11px] focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">汇付 RSA 公钥 (rsa_huifu_public_key) *</label>
                    <textarea
                      rows={2}
                      required
                      value={configForm.rsaHuifuPublicKey}
                      onChange={(e) => setConfigForm((prev) => ({ ...prev, rsaHuifuPublicKey: e.target.value }))}
                      placeholder="粘贴汇付平台公钥字符串 (MIIBIjANBgkq...)"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-[11px] focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="is_default_cfg"
                      checked={configForm.isDefault}
                      onChange={(e) => setConfigForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="is_default_cfg" className="text-slate-700 font-medium cursor-pointer">
                      设为此平台的全局默认商户配置
                    </label>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfigModalOpen(false)}
                      className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={configSaving}
                      className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      {configSaving ? '正在保存入库...' : editingConfigId ? '保存修改' : '确认新增入库'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
