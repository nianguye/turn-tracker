import { useAddServicesModal } from "../../context/AddServicesModalProvider";
import AddServicesModal from "./AddServicesModal";

import CloseIcon from '@mui/icons-material/Close';

import useFetchService from "../../utils/useFetchService.js"

const ServicesModal = ({ isOpen, onClose }) => {
    const { addServicesModalOpen, openAddServicesModal, closeAddServicesModal, newServiceFormData, changes } = useAddServicesModal();

    const { services, refreshService } = useFetchService();

    const addService = async (event) => {
        try {
            const response = await fetch('/api/service', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newServiceFormData)
            })

            refreshService();
            closeAddServicesModal();
        } catch (error) {
            console.error("Error:", error);
            return [];
        }
    }

    const createServiceCard = (service, index) => {
        return (
            <button
                className={`modal-card ${service.isHalfTurn ? "slashed" : ""}`}
                key={index}
                style={{ '--service-color': `${service.color}` }}
            >
                {service ? service.name : "Service Name"}
            </button>
        );
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal-background"
        >
            <AddServicesModal isOpen={addServicesModalOpen} onClose={closeAddServicesModal} newServiceFormData={newServiceFormData} changes={changes} createServiceCard={createServiceCard} addService={addService} />
            <div className="modal-container services-modal-container">
                <div className="modal-header">
                    Services
                </div>
                <button onClick={onClose} className="close-button">
                    <CloseIcon />
                </button>
                <div className="modal-button-header">
                    <button onClick={openAddServicesModal} className="modal-button add-service-button">
                        Add Service
                    </button>
                    <button className="modal-button edit-service-button">
                        Edit Service
                    </button>
                    <button className="modal-button delete-service-button">
                        Delete Service
                    </button>
                </div>
                <div className="modal-content-wrapper">
                    <div className="modal-content">
                        {services
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((service, index) =>
                                createServiceCard(service, index)
                            )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ServicesModal;