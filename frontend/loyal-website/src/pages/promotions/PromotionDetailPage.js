// pages/promotions/PromotionDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const PromotionDetailPage = () => {
    const { promotionId } = useParams();
    const { isManager } = useAuth();
    const navigate = useNavigate();
    const [promotion, setPromotion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        const fetchPromotion = async () => {
            try {
                const res = await api.get(`/promotions/${promotionId}`);
                setPromotion(res.data);
                setFormData({
                    title: res.data.title,
                    description: res.data.description,
                    startDate: res.data.startDate,
                    endDate: res.data.endDate
                });
            } catch (err) {
                console.error('Failed to fetch promotion:', err);
                alert('Failed to fetch promotion');
            } finally {
                setLoading(false);
            }
        };
        fetchPromotion();
    }, [promotionId]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this promotion?')) return;

        try {
            await api.delete(`/promotions/${promotionId}`);
            alert('Promotion deleted successfully');
            navigate('/promotions');
        } catch (err) {
            console.error('Failed to delete promotion:', err);
            alert('Failed to delete promotion');
        }
    };

    const handleSave = async () => {
        try {
            await api.patch(`/promotions/${promotionId}`, formData);
            alert('Promotion updated successfully');
            setEditing(false);
        } catch (err) {
            console.error('Failed to update promotion:', err);
            alert('Failed to update promotion');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!promotion) return <div>Promotion not found</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>Promotion Details</h2>
            {editing ? (
                <>
                    <div style={{ marginTop: '10px' }}>
                        <label>Title:</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                        />
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <label>Description:</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                        />
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <label>Start Date:</label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                        />
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <label>End Date:</label>
                        <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                        />
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <button onClick={handleSave} style={{ marginRight: '10px' }}>Save</button>
                        <button onClick={() => setEditing(false)}>Cancel</button>
                    </div>
                </>
            ) : (
                <>
                    <p><strong>Title:</strong> {promotion.title}</p>
                    <p><strong>Description:</strong> {promotion.description}</p>
                    <p><strong>Start Date:</strong> {promotion.startDate}</p>
                    <p><strong>End Date:</strong> {promotion.endDate}</p>

                    {isManager && (
                        <div style={{ marginTop: '20px' }}>
                            <button onClick={() => setEditing(true)} style={{ marginRight: '10px' }}>Edit</button>
                            <button onClick={handleDelete}>Delete</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PromotionDetailPage;
