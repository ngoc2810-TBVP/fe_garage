import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Space, message, Popconfirm } from "antd";
import axios from "axios";

const Customer = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleView = (id) => {
    navigate(`/admin/customers/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/admin/customers/edit/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      const API = `${process.env.REACT_APP_API_URL_ADMIN}/customers/delete/${id}`;
      const response = await axios.delete(API);
      if (response.data.code === 200) {
        message.success("Xóa khách hàng thành công");
        setData((prevData) => prevData.filter((item) => item._id !== id)); // Xóa khách hàng khỏi danh sách
      } else {
        message.error("Không thể xóa khách hàng");
      }
    } catch (error) {
      message.error("Lỗi khi xóa khách hàng");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:8080/admin/customers/get-all");
        if (response.data.code === 200) {
          setData(response.data.data);
        } else {
          message.error("Không thể tải dữ liệu khách hàng");
        }
      } catch (error) {
        message.error("Lỗi khi tải dữ liệu khách hàng");
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Họ và tên",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone_number",
      key: "phone_number",
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleView(record._id)}>
            Xem
          </Button>
          <Button type="link" onClick={() => handleEdit(record._id)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa khách hàng này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 5 }}
      bordered
    />
  );
};

export default Customer;
